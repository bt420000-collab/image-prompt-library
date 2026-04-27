import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.resolve(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "image_prompt_library.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function nowIso() {
  return new Date().toISOString();
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_no TEXT,
      title TEXT NOT NULL,
      category TEXT,
      source TEXT DEFAULT 'builtin',
      description TEXT,
      status TEXT DEFAULT 'ready',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS case_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      role TEXT DEFAULT 'main',
      page_index INTEGER DEFAULT 0,
      filename TEXT,
      file_path TEXT,
      thumb_path TEXT,
      width INTEGER,
      height INTEGER,
      aspect_ratio TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prompt_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      version_name TEXT DEFAULT 'v1',
      prompt_raw TEXT,
      prompt_display_cn TEXT,
      prompt_template_cn TEXT,
      prompt_engine_cn TEXT,
      variables_json TEXT,
      language_mode TEXT,
      prompt_style TEXT,
      rewrite_status TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS case_tags (
      case_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY(case_id, tag_id),
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cases_case_no ON cases(case_no);
    CREATE INDEX IF NOT EXISTS idx_cases_category ON cases(category);
    CREATE INDEX IF NOT EXISTS idx_cases_source ON cases(source);
    CREATE INDEX IF NOT EXISTS idx_cases_updated ON cases(updated_at);
    CREATE INDEX IF NOT EXISTS idx_images_case ON case_images(case_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_case ON prompt_versions(case_id);
  `);
}
