import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { db, nowIso } from "../db.js";
import { originalDir, makeThumb, publicUploadPath } from "../services/imageService.js";

export const casesRouter = Router();

const storage = multer.diskStorage({
  destination: originalDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg") || ".jpg";
    const base = path.basename(file.originalname || "image", ext).replace(/[^\w\u4e00-\u9fa5-]+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({ storage });

function latestPromptForCaseSelect() {
  return `
    SELECT pv.*
    FROM prompt_versions pv
    WHERE pv.case_id = ?
    ORDER BY pv.id DESC
    LIMIT 1
  `;
}

casesRouter.get("/", (req, res) => {
  const q = String(req.query.q || "").trim();
  const category = String(req.query.category || "").trim();
  const source = String(req.query.source || "").trim();
  const promptStyle = String(req.query.prompt_style || "").trim();
  const language = String(req.query.language_mode || "").trim();
  const limit = Math.min(Number(req.query.limit || 80), 300);
  const offset = Math.max(Number(req.query.offset || 0), 0);

  const where: string[] = [];
  const params: Record<string, unknown> = { limit, offset };

  if (q) {
    where.push(`(
      c.case_no LIKE @q OR c.title LIKE @q OR c.category LIKE @q OR c.description LIKE @q
      OR EXISTS (
        SELECT 1 FROM prompt_versions p
        WHERE p.case_id = c.id
        AND (
          p.prompt_raw LIKE @q OR p.prompt_display_cn LIKE @q OR p.prompt_template_cn LIKE @q
        )
      )
    )`);
    params.q = `%${q.replace(/^#/, "")}%`;
  }
  if (category && category !== "全部") {
    where.push("c.category = @category");
    params.category = category;
  }
  if (source && source !== "全部") {
    where.push("c.source = @source");
    params.source = source;
  }
  if (promptStyle && promptStyle !== "全部") {
    where.push(`EXISTS (SELECT 1 FROM prompt_versions p WHERE p.case_id = c.id AND p.prompt_style = @promptStyle)`);
    params.promptStyle = promptStyle;
  }
  if (language && language !== "全部") {
    where.push(`EXISTS (SELECT 1 FROM prompt_versions p WHERE p.case_id = c.id AND p.language_mode = @language)`);
    params.language = language;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db.prepare(`
    SELECT
      c.*,
      (SELECT file_path FROM case_images i WHERE i.case_id = c.id ORDER BY page_index, id LIMIT 1) AS image_path,
      (SELECT thumb_path FROM case_images i WHERE i.case_id = c.id ORDER BY page_index, id LIMIT 1) AS thumb_path,
      (SELECT COUNT(*) FROM case_images i WHERE i.case_id = c.id) AS image_count,
      (SELECT prompt_style FROM prompt_versions p WHERE p.case_id = c.id ORDER BY id DESC LIMIT 1) AS prompt_style,
      (SELECT language_mode FROM prompt_versions p WHERE p.case_id = c.id ORDER BY id DESC LIMIT 1) AS language_mode,
      (SELECT rewrite_status FROM prompt_versions p WHERE p.case_id = c.id ORDER BY id DESC LIMIT 1) AS rewrite_status
    FROM cases c
    ${whereSql}
    ORDER BY
      CASE WHEN c.case_no GLOB '[0-9]*' THEN CAST(c.case_no AS INTEGER) ELSE 999999 END,
      c.updated_at DESC
    LIMIT @limit OFFSET @offset
  `).all(params);

  const total = db.prepare(`SELECT COUNT(*) AS count FROM cases c ${whereSql}`).get(params) as { count: number };
  res.json({ items: rows, total: total.count, limit, offset });
});

casesRouter.get("/meta", (_req, res) => {
  const categories = db.prepare("SELECT category AS name, COUNT(*) AS count FROM cases GROUP BY category ORDER BY count DESC, name").all();
  const sources = db.prepare("SELECT source AS name, COUNT(*) AS count FROM cases GROUP BY source ORDER BY count DESC, name").all();
  const promptStyles = db.prepare("SELECT prompt_style AS name, COUNT(*) AS count FROM prompt_versions WHERE id IN (SELECT MAX(id) FROM prompt_versions GROUP BY case_id) GROUP BY prompt_style ORDER BY count DESC").all();
  const languages = db.prepare("SELECT language_mode AS name, COUNT(*) AS count FROM prompt_versions WHERE id IN (SELECT MAX(id) FROM prompt_versions GROUP BY case_id) GROUP BY language_mode ORDER BY count DESC").all();
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM cases) AS cases,
      (SELECT COUNT(*) FROM case_images) AS images,
      (SELECT COUNT(*) FROM cases WHERE source = 'builtin') AS builtin,
      (SELECT COUNT(*) FROM cases WHERE source = 'user') AS user
  `).get();
  res.json({ categories, sources, promptStyles, languages, stats });
});

casesRouter.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const c = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  if (!c) return res.status(404).json({ error: "案例不存在" });
  const images = db.prepare("SELECT * FROM case_images WHERE case_id = ? ORDER BY page_index, id").all(id);
  const prompt = db.prepare(latestPromptForCaseSelect()).get(id);
  const versions = db.prepare("SELECT id, version_name, language_mode, prompt_style, rewrite_status, created_at FROM prompt_versions WHERE case_id = ? ORDER BY id DESC").all(id);
  const tags = db.prepare(`
    SELECT t.name FROM tags t
    JOIN case_tags ct ON ct.tag_id = t.id
    WHERE ct.case_id = ?
    ORDER BY t.name
  `).all(id);
  res.json({ case: c, images, prompt, versions, tags });
});

casesRouter.post("/", (req, res) => {
  const body = req.body || {};
  const createdAt = nowIso();
  const result = db.prepare(`
    INSERT INTO cases (case_no, title, category, source, description, status, created_at, updated_at)
    VALUES (@case_no, @title, @category, 'user', @description, 'ready', @created_at, @updated_at)
  `).run({
    case_no: body.case_no || `user-${Date.now()}`,
    title: body.title || "未命名案例",
    category: body.category || "我的案例",
    description: body.description || "",
    created_at: createdAt,
    updated_at: createdAt
  });
  const caseId = Number(result.lastInsertRowid);
  db.prepare(`
    INSERT INTO prompt_versions (
      case_id, version_name, prompt_raw, prompt_display_cn, prompt_template_cn, prompt_engine_cn,
      variables_json, language_mode, prompt_style, rewrite_status, created_at
    )
    VALUES (?, 'user-v1', ?, ?, ?, ?, '[]', 'zh', 'natural', 'user_created', ?)
  `).run(
    caseId,
    body.prompt_raw || "",
    body.prompt_display_cn || "",
    body.prompt_template_cn || "",
    body.prompt_engine_cn || body.prompt_template_cn || "",
    createdAt
  );
  res.status(201).json({ id: caseId });
});

casesRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const exists = db.prepare("SELECT id FROM cases WHERE id = ?").get(id);
  if (!exists) return res.status(404).json({ error: "案例不存在" });
  db.prepare(`
    UPDATE cases
    SET title = @title, category = @category, description = @description, updated_at = @updated_at
    WHERE id = @id
  `).run({
    id,
    title: body.title || "未命名案例",
    category: body.category || "我的案例",
    description: body.description || "",
    updated_at: nowIso()
  });
  res.json({ ok: true });
});

casesRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  db.prepare("DELETE FROM cases WHERE id = ?").run(id);
  res.json({ ok: true });
});

casesRouter.post("/:id/images", upload.array("images", 20), async (req, res) => {
  const caseId = Number(req.params.id);
  const exists = db.prepare("SELECT id FROM cases WHERE id = ?").get(caseId);
  if (!exists) return res.status(404).json({ error: "案例不存在" });

  const role = String(req.body.role || "page");
  const files = (req.files || []) as Express.Multer.File[];
  const created: unknown[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const thumb = await makeThumb(file.path, file.filename);
    const row = {
      case_id: caseId,
      role,
      page_index: Number(req.body.page_index || 0) + i,
      filename: file.filename,
      file_path: publicUploadPath("original", file.filename),
      thumb_path: thumb.thumbPath,
      width: thumb.width,
      height: thumb.height,
      aspect_ratio: thumb.aspectRatio,
      created_at: nowIso()
    };
    const r = db.prepare(`
      INSERT INTO case_images (case_id, role, page_index, filename, file_path, thumb_path, width, height, aspect_ratio, created_at)
      VALUES (@case_id, @role, @page_index, @filename, @file_path, @thumb_path, @width, @height, @aspect_ratio, @created_at)
    `).run(row);
    created.push({ id: r.lastInsertRowid, ...row });
  }
  db.prepare("UPDATE cases SET updated_at = ? WHERE id = ?").run(nowIso(), caseId);
  res.status(201).json({ images: created });
});

casesRouter.delete("/images/:imageId", (req, res) => {
  const imageId = Number(req.params.imageId);
  db.prepare("DELETE FROM case_images WHERE id = ?").run(imageId);
  res.json({ ok: true });
});
