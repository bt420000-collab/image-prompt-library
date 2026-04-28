import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { initDb } from "./db.js";
import { importBuiltinCases, hasBuiltinCases, ensureDefaultTags } from "./services/importBuiltin.js";
import { casesRouter } from "./routes/cases.js";

const app = express();
const port = Number(process.env.PORT || 3177);

initDb();

try {
  if (!hasBuiltinCases()) {
    const result = importBuiltinCases();
    console.log("[seed]", result);
  }
  console.log("[tags]", ensureDefaultTags());
} catch (error) {
  console.warn("[seed skipped]", error instanceof Error ? error.message : error);
}

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

const publicDir = path.resolve(process.cwd(), "dist");
const publicDataDir = path.resolve(process.cwd(), "public/data");
if (fs.existsSync(publicDataDir)) {
  app.use("/data", express.static(publicDataDir));
}

app.use("/api/cases", casesRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: "图像配方库 ImagePrompt Library" });
});

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.type("html").send(`
      <!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>图像配方库 ImagePrompt Library</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              background: #f5f5f2;
              color: #171717;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
            }
            main {
              max-width: 720px;
              padding: 36px;
              background: white;
              border: 1px solid #e8e5dd;
              border-radius: 24px;
              box-shadow: 0 16px 50px rgba(23,23,23,.08);
            }
            h1 { margin: 0 0 10px; letter-spacing: -.04em; }
            p { line-height: 1.8; color: #555; }
            code {
              padding: 3px 7px;
              border-radius: 8px;
              background: #f1eee8;
            }
          </style>
        </head>
        <body>
          <main>
            <h1>图像配方库后端已启动</h1>
            <p>你现在打开的是后端服务 <code>http://localhost:${port}</code>。</p>
            <p>开发模式请打开前端地址：<code>http://localhost:5173</code></p>
            <p>如果想让后端直接显示前端页面，请先运行 <code>npm run build</code>，再运行 <code>npm start</code>。</p>
            <p>健康检查：<code>/api/health</code></p>
          </main>
        </body>
      </html>
    `);
  });
}

app.listen(port, () => {
  console.log(`ImagePrompt Library server listening at http://localhost:${port}`);
  if (!fs.existsSync(publicDir)) {
    console.log("Dev mode tip: open the Vite frontend at http://localhost:5173");
  }
});
