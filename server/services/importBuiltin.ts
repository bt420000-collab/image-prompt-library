import fs from "node:fs";
import path from "node:path";
import { db, nowIso } from "../db.js";

type BuiltinCase = {
  id: number;
  case_no?: string;
  name?: string;
  category_group?: string;
  case_type_raw?: string;
  image_filename?: string;
  image_path?: string;
  prompt_raw?: string;
  prompt?: string;
  prompt_display_cn?: string;
  prompt_template_cn?: string;
  prompt_engine_cn?: string;
  variables?: unknown[];
  language_mode?: string;
  prompt_style?: string;
  rewrite_status?: string;
  source_text?: string;
};

function safeTitle(item: BuiltinCase) {
  const name = (item.name || "").trim();
  if (name && !["type", "subject", "reference", "voice"].includes(name.toLowerCase())) return name;
  return item.case_type_raw || item.category_group || `Case ${item.id}`;
}

function builtinManifestPath() {
  return path.resolve(process.cwd(), "data/builtin/awesome_gpt_image_cases_v2_prompt_optimized_cn.json");
}

export function hasBuiltinCases() {
  const row = db.prepare("SELECT COUNT(*) AS count FROM cases WHERE source = 'builtin'").get() as { count: number };
  return row.count > 0;
}

export function importBuiltinCases({ overwrite = false } = {}) {
  const manifest = builtinManifestPath();
  if (!fs.existsSync(manifest)) {
    throw new Error(`找不到内置清单：${manifest}`);
  }

  if (overwrite) {
    db.prepare("DELETE FROM cases WHERE source = 'builtin'").run();
  } else if (hasBuiltinCases()) {
    return { imported: 0, skipped: true };
  }

  const raw = JSON.parse(fs.readFileSync(manifest, "utf-8"));
  const items: BuiltinCase[] = raw.cases || [];
  const createdAt = nowIso();

  const insertCase = db.prepare(`
    INSERT INTO cases (case_no, title, category, source, description, status, created_at, updated_at)
    VALUES (@case_no, @title, @category, 'builtin', @description, 'ready', @created_at, @updated_at)
  `);
  const insertImage = db.prepare(`
    INSERT INTO case_images (case_id, role, page_index, filename, file_path, thumb_path, width, height, aspect_ratio, created_at)
    VALUES (@case_id, 'main', 0, @filename, @file_path, @thumb_path, NULL, NULL, NULL, @created_at)
  `);
  const insertPrompt = db.prepare(`
    INSERT INTO prompt_versions (
      case_id, version_name, prompt_raw, prompt_display_cn, prompt_template_cn, prompt_engine_cn,
      variables_json, language_mode, prompt_style, rewrite_status, created_at
    )
    VALUES (
      @case_id, 'v2-cn', @prompt_raw, @prompt_display_cn, @prompt_template_cn, @prompt_engine_cn,
      @variables_json, @language_mode, @prompt_style, @rewrite_status, @created_at
    )
  `);

  const tx = db.transaction(() => {
    for (const item of items) {
      const title = safeTitle(item);
      const result = insertCase.run({
        case_no: String(item.id),
        title,
        category: item.category_group || item.case_type_raw || "未分类",
        description: item.case_type_raw || "",
        created_at: createdAt,
        updated_at: createdAt
      });
      const caseId = Number(result.lastInsertRowid);
      const filename = item.image_filename || `case${item.id}.jpg`;
      const filePath = item.image_path ? `/${item.image_path}` : `/data/images/${filename}`;
      insertImage.run({
        case_id: caseId,
        filename,
        file_path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        thumb_path: filePath.startsWith("/") ? filePath : `/${filePath}`,
        created_at: createdAt
      });
      insertPrompt.run({
        case_id: caseId,
        prompt_raw: item.prompt_raw || item.prompt || "",
        prompt_display_cn: item.prompt_display_cn || "",
        prompt_template_cn: item.prompt_template_cn || "",
        prompt_engine_cn: item.prompt_engine_cn || item.prompt_template_cn || "",
        variables_json: JSON.stringify(item.variables || []),
        language_mode: item.language_mode || "",
        prompt_style: item.prompt_style || "",
        rewrite_status: item.rewrite_status || "",
        created_at: createdAt
      });
    }
  });

  tx();
  return { imported: items.length, skipped: false };
}
