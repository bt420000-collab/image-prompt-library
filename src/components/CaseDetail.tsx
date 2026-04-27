import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Maximize2 } from "lucide-react";
import { fetchCase } from "../lib/api";
import type { CaseDetail as Detail, CaseImage } from "../types";

type Props = {
  id: number;
  onBack: () => void;
};

type Tab = "display" | "template" | "raw" | "assets" | "meta";

function copyText(text: string) {
  navigator.clipboard.writeText(text || "");
}

function ImageStage({ images }: { images: CaseImage[] }) {
  const [active, setActive] = useState(0);
  const image = images[active];

  if (!image) return <div className="image-stage empty">暂无图片</div>;

  return (
    <div className="image-stage">
      <div className="image-toolbar">
        <span>{image.role} · {image.aspect_ratio || "未知比例"}</span>
        <a href={image.file_path} target="_blank" rel="noreferrer"><Maximize2 size={16} /> 打开原图</a>
      </div>
      <div className="image-canvas">
        <img src={image.file_path} alt={image.filename} />
      </div>
      {images.length > 1 && (
        <div className="film-strip">
          {images.map((img, idx) => (
            <button key={img.id} className={idx === active ? "active" : ""} onClick={() => setActive(idx)}>
              <img src={img.thumb_path || img.file_path} alt={img.filename} />
              <span>{idx + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CaseDetail({ id, onBack }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [tab, setTab] = useState<Tab>("display");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCase(id).then(setDetail).finally(() => setLoading(false));
  }, [id]);

  const promptText = useMemo(() => {
    if (!detail?.prompt) return "";
    if (tab === "display") return detail.prompt.prompt_display_cn;
    if (tab === "template") return detail.prompt.prompt_template_cn;
    if (tab === "raw") return detail.prompt.prompt_raw;
    return "";
  }, [detail, tab]);

  if (loading) return <main className="detail-page"><div className="loading">载入中...</div></main>;
  if (!detail) return <main className="detail-page"><button onClick={onBack}>返回</button>案例不存在</main>;

  return (
    <main className="detail-page">
      <header className="detail-header">
        <button className="ghost-btn" onClick={onBack}><ArrowLeft size={18} /> 返回图库</button>
        <div>
          <h1>#{detail.case.case_no} {detail.case.title}</h1>
          <p>{detail.case.category} · {detail.case.source === "builtin" ? "内置案例" : "我的案例"} · {detail.images.length} 张图</p>
        </div>
      </header>

      <div className="detail-grid">
        <ImageStage images={detail.images} />

        <section className="prompt-panel">
          <nav className="tabs">
            <button className={tab === "display" ? "active" : ""} onClick={() => setTab("display")}>展示说明</button>
            <button className={tab === "template" ? "active" : ""} onClick={() => setTab("template")}>填空模板</button>
            <button className={tab === "raw" ? "active" : ""} onClick={() => setTab("raw")}>原始提示词</button>
            <button className={tab === "assets" ? "active" : ""} onClick={() => setTab("assets")}>图片资产</button>
            <button className={tab === "meta" ? "active" : ""} onClick={() => setTab("meta")}>元信息</button>
          </nav>

          {["display", "template", "raw"].includes(tab) && (
            <>
              <div className="panel-actions">
                <button className="copy-btn" onClick={() => copyText(promptText)}><Copy size={16} /> 复制</button>
              </div>
              <pre className="prompt-text">{promptText || "暂无内容"}</pre>
            </>
          )}

          {tab === "assets" && (
            <div className="asset-list">
              {detail.images.map((img) => (
                <div key={img.id} className="asset-row">
                  <img src={img.thumb_path || img.file_path} alt={img.filename} />
                  <div>
                    <b>{img.filename}</b>
                    <p>{img.role} · 第 {img.page_index + 1} 张 · {img.width || "?"}×{img.height || "?"}</p>
                    <code>{img.file_path}</code>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "meta" && (
            <div className="meta-box">
              <p><b>提示词风格：</b>{detail.prompt?.prompt_style || "未标记"}</p>
              <p><b>语言状态：</b>{detail.prompt?.language_mode || "未标记"}</p>
              <p><b>清洗状态：</b>{detail.prompt?.rewrite_status || "未标记"}</p>
              <p><b>创建时间：</b>{detail.case.created_at}</p>
              <p><b>更新时间：</b>{detail.case.updated_at}</p>
              <p><b>说明：</b>{detail.case.description || "无"}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
