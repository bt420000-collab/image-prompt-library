import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { db, nowIso } from "../db.js";
import { originalDir, makeThumb, publicUploadPath } from "../services/imageService.js";
import { isChineseTagName, isFunRecipeTag, MAIN_IMAGE_TAGS, normalizeImageTags } from "../services/tagService.js";

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
  return `SELECT pv.* FROM prompt_versions pv WHERE pv.case_id = ? ORDER BY pv.id DESC LIMIT 1`;
}

function normalizeTags(input: unknown): string[] {
  if (Array.isArray(input)) return Array.from(new Set(input.map((x) => String(x || "").trim()).filter(Boolean)));
  return Array.from(new Set(String(input || "").split(/[，,;；\n]+/).map((x) => x.trim().replace(/^#+/, "")).filter(Boolean).slice(0, 40)));
}

function setCaseTags(caseId: number, tags: string[]) {
  const clean = normalizeImageTags(tags);
  const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
  const getTag = db.prepare("SELECT id FROM tags WHERE name = ?");
  const link = db.prepare("INSERT OR IGNORE INTO case_tags (case_id, tag_id) VALUES (?, ?)");
  db.prepare("DELETE FROM case_tags WHERE case_id = ?").run(caseId);
  for (const name of clean) {
    insertTag.run(name);
    const row = getTag.get(name) as { id: number } | undefined;
    if (row) link.run(caseId, row.id);
  }
}

function tagsForCaseSql() {
  return `SELECT GROUP_CONCAT(t.name, '，') FROM tags t JOIN case_tags ct ON ct.tag_id = t.id WHERE ct.case_id = c.id`;
}

casesRouter.get("/", (req, res) => {
  const q = String(req.query.q || "").trim();
  const tag = String(req.query.tag || "").trim();
  const tagGroup = String(req.query.tag_group || "").trim();
  const source = String(req.query.source || "").trim();
  const promptStyle = String(req.query.prompt_style || "").trim();
  const language = String(req.query.language_mode || "").trim();
  const limit = Math.min(Number(req.query.limit || 80), 300);
  const offset = Math.max(Number(req.query.offset || 0), 0);
  const where: string[] = [];
  const params: Record<string, unknown> = { limit, offset };
  if (q) {
    where.push(`(c.case_no LIKE @q OR c.title LIKE @q OR c.category LIKE @q OR c.description LIKE @q
      OR EXISTS (SELECT 1 FROM prompt_versions p WHERE p.case_id = c.id AND (p.prompt_raw LIKE @q OR p.prompt_display_cn LIKE @q OR p.prompt_template_cn LIKE @q))
      OR EXISTS (SELECT 1 FROM tags t JOIN case_tags ct ON ct.tag_id = t.id WHERE ct.case_id = c.id AND t.name LIKE @q))`);
    params.q = `%${q.replace(/^#/, "")}%`;
  }
  if ((tagGroup === "fun" || tag === "趣味配方") && tag !== "全部") {
    const mainTagPlaceholders = MAIN_IMAGE_TAGS.map((_, index) => `@mainTag${index}`).join(", ");
    MAIN_IMAGE_TAGS.forEach((name, index) => {
      params[`mainTag${index}`] = name;
    });
    where.push(`EXISTS (
      SELECT 1 FROM tags t
      JOIN case_tags ct ON ct.tag_id = t.id
      WHERE ct.case_id = c.id
      AND (t.name = '趣味配方' OR t.name NOT IN (${mainTagPlaceholders}))
    )`);
  } else if (tag && tag !== "全部") {
    where.push(`EXISTS (SELECT 1 FROM tags t JOIN case_tags ct ON ct.tag_id = t.id WHERE ct.case_id = c.id AND t.name = @tag)`);
    params.tag = tag;
  }
  if (source && source !== "全部") { where.push("c.source = @source"); params.source = source; }
  if (promptStyle && promptStyle !== "全部") { where.push(`EXISTS (SELECT 1 FROM prompt_versions p WHERE p.case_id = c.id AND p.prompt_style = @promptStyle)`); params.promptStyle = promptStyle; }
  if (language && language !== "全部") { where.push(`EXISTS (SELECT 1 FROM prompt_versions p WHERE p.case_id = c.id AND p.language_mode = @language)`); params.language = language; }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db.prepare(`
    SELECT c.*,
      (SELECT file_path FROM case_images i WHERE i.case_id = c.id ORDER BY page_index, id LIMIT 1) AS image_path,
      (SELECT thumb_path FROM case_images i WHERE i.case_id = c.id ORDER BY page_index, id LIMIT 1) AS thumb_path,
      (SELECT COUNT(*) FROM case_images i WHERE i.case_id = c.id) AS image_count,
      (SELECT prompt_style FROM prompt_versions p WHERE p.case_id = c.id ORDER BY id DESC LIMIT 1) AS prompt_style,
      (SELECT language_mode FROM prompt_versions p WHERE p.case_id = c.id ORDER BY id DESC LIMIT 1) AS language_mode,
      (SELECT rewrite_status FROM prompt_versions p WHERE p.case_id = c.id ORDER BY id DESC LIMIT 1) AS rewrite_status,
      (${tagsForCaseSql()}) AS tags
    FROM cases c ${whereSql}
    ORDER BY CASE WHEN c.case_no GLOB '[0-9]*' THEN CAST(c.case_no AS INTEGER) ELSE 999999 END, c.updated_at DESC
    LIMIT @limit OFFSET @offset`).all(params);
  const total = db.prepare(`SELECT COUNT(*) AS count FROM cases c ${whereSql}`).get(params) as { count: number };
  res.json({ items: rows, total: total.count, limit, offset });
});

casesRouter.get("/meta", (_req, res) => {
    const allTags = db.prepare(`SELECT t.name AS name, COUNT(ct.case_id) AS count FROM tags t JOIN case_tags ct ON ct.tag_id = t.id GROUP BY t.id ORDER BY count DESC, t.name`).all() as Array<{ name: string; count: number }>;
  const chineseTags = allTags.filter((x) => isChineseTagName(x.name));
  const mainTags = MAIN_IMAGE_TAGS.map((name) => ({
    name,
    count: chineseTags
      .filter((x) => x.name === name || (name === "趣味配方" && isFunRecipeTag(x.name)))
      .reduce((sum, x) => sum + x.count, 0)
  })).filter((x) => x.count > 0);
  const funSubTags = chineseTags
    .filter((x) => isFunRecipeTag(x.name) && x.name !== "趣味配方")
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
  const tags = mainTags;
  const categories = db.prepare("SELECT category AS name, COUNT(*) AS count FROM cases GROUP BY category ORDER BY count DESC, name").all();
  const sources = db.prepare("SELECT source AS name, COUNT(*) AS count FROM cases GROUP BY source ORDER BY count DESC, name").all();
  const promptStyles = db.prepare("SELECT prompt_style AS name, COUNT(*) AS count FROM prompt_versions WHERE id IN (SELECT MAX(id) FROM prompt_versions GROUP BY case_id) GROUP BY prompt_style ORDER BY count DESC").all();
  const languages = db.prepare("SELECT language_mode AS name, COUNT(*) AS count FROM prompt_versions WHERE id IN (SELECT MAX(id) FROM prompt_versions GROUP BY case_id) GROUP BY language_mode ORDER BY count DESC").all();
  const stats = db.prepare(`SELECT (SELECT COUNT(*) FROM cases) AS cases, (SELECT COUNT(*) FROM case_images) AS images, (SELECT COUNT(*) FROM cases WHERE source = 'builtin') AS builtin, (SELECT COUNT(*) FROM cases WHERE source = 'user') AS user, (SELECT COUNT(*) FROM tags) AS tags`).get();
  res.json({ tags, funSubTags, categories, sources, promptStyles, languages, stats });
});

casesRouter.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const c = db.prepare("SELECT * FROM cases WHERE id = ?").get(id);
  if (!c) return res.status(404).json({ error: "案例不存在" });
  const images = db.prepare("SELECT * FROM case_images WHERE case_id = ? ORDER BY page_index, id").all(id);
  const prompt = db.prepare(latestPromptForCaseSelect()).get(id);
  const versions = db.prepare("SELECT id, version_name, language_mode, prompt_style, rewrite_status, created_at FROM prompt_versions WHERE case_id = ? ORDER BY id DESC").all(id);
  const tags = db.prepare(`SELECT t.name FROM tags t JOIN case_tags ct ON ct.tag_id = t.id WHERE ct.case_id = ? ORDER BY t.name`).all(id);
  res.json({ case: c, images, prompt, versions, tags });
});

casesRouter.post("/", (req, res) => {
  const body = req.body || {};
  const createdAt = nowIso();
  const result = db.prepare(`INSERT INTO cases (case_no, title, category, source, description, status, created_at, updated_at) VALUES (@case_no, @title, @category, 'user', @description, 'ready', @created_at, @updated_at)`).run({ case_no: body.case_no || `user-${Date.now()}`, title: body.title || "未命名案例", category: body.category || "我的案例", description: body.description || "", created_at: createdAt, updated_at: createdAt });
  const caseId = Number(result.lastInsertRowid);
  db.prepare(`INSERT INTO prompt_versions (case_id, version_name, prompt_raw, prompt_display_cn, prompt_template_cn, prompt_engine_cn, variables_json, language_mode, prompt_style, rewrite_status, created_at) VALUES (?, 'user-v1', ?, ?, ?, ?, '[]', 'zh', 'natural', 'user_created', ?)`).run(caseId, body.prompt_raw || "", body.prompt_display_cn || "", body.prompt_template_cn || "", body.prompt_engine_cn || body.prompt_template_cn || "", createdAt);
  const initialTags = normalizeImageTags(body.tags);
  setCaseTags(caseId, initialTags.length ? initialTags : normalizeImageTags([body.category || "我的案例"]));
  res.status(201).json({ id: caseId });
});

casesRouter.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const exists = db.prepare("SELECT id FROM cases WHERE id = ?").get(id);
  if (!exists) return res.status(404).json({ error: "案例不存在" });
  const updatedAt = nowIso();
  db.prepare(`UPDATE cases SET title = @title, category = @category, description = @description, updated_at = @updated_at WHERE id = @id`).run({ id, title: body.title || "未命名案例", category: body.category || "我的案例", description: body.description || "", updated_at: updatedAt });
  const latest = db.prepare("SELECT id FROM prompt_versions WHERE case_id = ? ORDER BY id DESC LIMIT 1").get(id) as { id: number } | undefined;
  if (latest) {
    db.prepare(`UPDATE prompt_versions SET prompt_raw = @prompt_raw, prompt_display_cn = @prompt_display_cn, prompt_template_cn = @prompt_template_cn, prompt_engine_cn = @prompt_engine_cn, variables_json = @variables_json, rewrite_status = @rewrite_status WHERE id = @id`).run({ id: latest.id, prompt_raw: body.prompt_raw || "", prompt_display_cn: body.prompt_display_cn || "", prompt_template_cn: body.prompt_template_cn || "", prompt_engine_cn: body.prompt_engine_cn || body.prompt_template_cn || "", variables_json: body.variables_json || "[]", rewrite_status: body.rewrite_status || "user_edited" });
  } else {
    db.prepare(`INSERT INTO prompt_versions (case_id, version_name, prompt_raw, prompt_display_cn, prompt_template_cn, prompt_engine_cn, variables_json, language_mode, prompt_style, rewrite_status, created_at) VALUES (?, 'user-v1', ?, ?, ?, ?, ?, 'zh', 'natural', 'user_edited', ?)`).run(id, body.prompt_raw || "", body.prompt_display_cn || "", body.prompt_template_cn || "", body.prompt_engine_cn || body.prompt_template_cn || "", body.variables_json || "[]", updatedAt);
  }
  if (body.tags !== undefined) setCaseTags(id, normalizeTags(body.tags));
  res.json({ ok: true });
});

casesRouter.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM cases WHERE id = ?").run(Number(req.params.id));
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
    const row = { case_id: caseId, role, page_index: Number(req.body.page_index || 0) + i, filename: file.filename, file_path: publicUploadPath("original", file.filename), thumb_path: thumb.thumbPath, width: thumb.width, height: thumb.height, aspect_ratio: thumb.aspectRatio, created_at: nowIso() };
    const r = db.prepare(`INSERT INTO case_images (case_id, role, page_index, filename, file_path, thumb_path, width, height, aspect_ratio, created_at) VALUES (@case_id, @role, @page_index, @filename, @file_path, @thumb_path, @width, @height, @aspect_ratio, @created_at)`).run(row);
    created.push({ id: r.lastInsertRowid, ...row });
  }
  db.prepare("UPDATE cases SET updated_at = ? WHERE id = ?").run(nowIso(), caseId);
  res.status(201).json({ images: created });
});

casesRouter.put("/images/:imageId", upload.single("image"), async (req, res) => {
  const imageId = Number(req.params.imageId);
  const image = db.prepare("SELECT * FROM case_images WHERE id = ?").get(imageId) as { id: number; case_id: number } | undefined;
  if (!image) return res.status(404).json({ error: "图片不存在" });
  const file = req.file;
  if (!file) return res.status(400).json({ error: "没有上传图片" });
  const thumb = await makeThumb(file.path, file.filename);
  db.prepare(`UPDATE case_images SET filename = @filename, file_path = @file_path, thumb_path = @thumb_path, width = @width, height = @height, aspect_ratio = @aspect_ratio WHERE id = @id`).run({ id: imageId, filename: file.filename, file_path: publicUploadPath("original", file.filename), thumb_path: thumb.thumbPath, width: thumb.width, height: thumb.height, aspect_ratio: thumb.aspectRatio });
  db.prepare("UPDATE cases SET updated_at = ? WHERE id = ?").run(nowIso(), image.case_id);
  res.json({ ok: true });
});

casesRouter.delete("/images/:imageId", (req, res) => {
  db.prepare("DELETE FROM case_images WHERE id = ?").run(Number(req.params.imageId));
  res.json({ ok: true });
});
