import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Edit3, Maximize2, Save, Trash2, Upload, X } from "lucide-react";
import { deleteCase, deleteImage, fetchCase, replaceImage, updateCase, uploadImages } from "../lib/api";
import type { CaseDetail as Detail, CaseImage } from "../types";

type Props = { id: number; onBack: () => void };
type Tab = "display" | "template" | "raw" | "assets" | "meta";
function copyText(text: string) { navigator.clipboard.writeText(text || ""); }

type DraftState = { title: string; category: string; description: string; tags: string; prompt_raw: string; prompt_display_cn: string; prompt_template_cn: string; prompt_engine_cn: string; variables_json: string };
function draftFromDetail(detail: Detail): DraftState {
  return { title: detail.case.title || "", category: detail.case.category || "", description: detail.case.description || "", tags: detail.tags.map((x) => x.name).join("，"), prompt_raw: detail.prompt?.prompt_raw || "", prompt_display_cn: detail.prompt?.prompt_display_cn || "", prompt_template_cn: detail.prompt?.prompt_template_cn || "", prompt_engine_cn: detail.prompt?.prompt_engine_cn || detail.prompt?.prompt_template_cn || "", variables_json: detail.prompt?.variables_json || "[]" };
}

function ImageStage({ images }: { images: CaseImage[] }) {
  const [active, setActive] = useState(0);
  const image = images[active];
  if (!image) return <div className="image-stage empty">暂无图片</div>;
  return (
    <div className="image-stage">
      <div className="image-toolbar"><span>{image.role} · {image.aspect_ratio || "未知比例"}</span><a href={image.file_path} target="_blank" rel="noreferrer"><Maximize2 size={16} /> 打开原图</a></div>
      <div className="image-canvas"><img src={image.file_path} alt={image.filename} /></div>
      {images.length > 1 && <div className="film-strip">{images.map((img, idx) => <button key={img.id} className={idx === active ? "active" : ""} onClick={() => setActive(idx)}><img src={img.thumb_path || img.file_path} alt={img.filename} /><span>{idx + 1}</span></button>)}</div>}
    </div>
  );
}

export function CaseDetail({ id, onBack }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [tab, setTab] = useState<Tab>("display");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  async function load() { setLoading(true); try { const data = await fetchCase(id); setDetail(data); setDraft(draftFromDetail(data)); } finally { setLoading(false); } }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  const promptText = useMemo(() => {
    if (!draft) return "";
    if (tab === "display") return draft.prompt_display_cn;
    if (tab === "template") return draft.prompt_template_cn;
    if (tab === "raw") return draft.prompt_raw;
    return "";
  }, [tab, draft]);
  async function save() { if (!draft) return; setSaving(true); try { await updateCase(id, draft); await load(); setEditing(false); } finally { setSaving(false); } }
  async function removeCase() { if (!confirm("确定删除这个案例？相关图片记录和提示词版本也会删除。")) return; await deleteCase(id); onBack(); }
  async function addImages(files: FileList | null) { if (!files?.length) return; await uploadImages(id, Array.from(files)); await load(); }
  async function doReplaceImage(imageId: number, files: FileList | null) { const file = files?.[0]; if (!file) return; await replaceImage(imageId, file); await load(); }
  async function doDeleteImage(imageId: number) { if (!confirm("确定删除这张图片？")) return; await deleteImage(imageId); await load(); }
  if (loading) return <main className="detail-page"><div className="loading">载入中...</div></main>;
  if (!detail || !draft) return <main className="detail-page"><button onClick={onBack}>返回</button>案例不存在</main>;
  const textTabs = ["display", "template", "raw"].includes(tab);
  return (
    <main className="detail-page">
      <header className="detail-header">
        <button className="ghost-btn" onClick={onBack}><ArrowLeft size={18} /> 返回图库</button>
        <div className="detail-title-block">{editing ? <><input className="title-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /><input className="meta-input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="分类" /></> : <><h1>#{detail.case.case_no} {detail.case.title}</h1><p>{detail.case.category} · {detail.case.source === "builtin" ? "内置案例" : "我的案例"} · {detail.images.length} 张图</p></>}</div>
        <div className="header-actions">{editing ? <><button className="primary-btn" onClick={save} disabled={saving}><Save size={17} /> {saving ? "保存中" : "保存编辑"}</button><button className="ghost-btn" onClick={() => { setDraft(draftFromDetail(detail)); setEditing(false); }}><X size={17} /> 取消</button></> : <button className="ghost-btn" onClick={() => setEditing(true)}><Edit3 size={17} /> 编辑</button>}<button className="danger-btn" onClick={removeCase}><Trash2 size={17} /> 删除案例</button></div>
      </header>
      <div className="detail-grid">
        <ImageStage images={detail.images} />
        <section className="prompt-panel">
          <nav className="tabs"><button className={tab === "display" ? "active" : ""} onClick={() => setTab("display")}>展示说明</button><button className={tab === "template" ? "active" : ""} onClick={() => setTab("template")}>填空模板</button><button className={tab === "raw" ? "active" : ""} onClick={() => setTab("raw")}>原始提示词</button><button className={tab === "assets" ? "active" : ""} onClick={() => setTab("assets")}>图片资产</button><button className={tab === "meta" ? "active" : ""} onClick={() => setTab("meta")}>元信息</button></nav>
          {textTabs && <><div className="panel-actions"><button className="copy-btn" onClick={() => copyText(promptText)}><Copy size={16} /> 复制</button>{!editing && <button className="copy-btn" onClick={() => setEditing(true)}><Edit3 size={16} /> 编辑</button>}{editing && <button className="copy-btn" onClick={save}><Save size={16} /> 保存</button>}</div>{editing ? <textarea className="prompt-editor" value={promptText} onChange={(e) => { if (tab === "display") setDraft({ ...draft, prompt_display_cn: e.target.value }); if (tab === "template") setDraft({ ...draft, prompt_template_cn: e.target.value, prompt_engine_cn: e.target.value }); if (tab === "raw") setDraft({ ...draft, prompt_raw: e.target.value }); }} /> : <pre className="prompt-text">{promptText || "暂无内容"}</pre>}</>}
          {tab === "assets" && <div className="asset-list"><label className="upload-box"><Upload size={18} /> 上传新图片<input type="file" accept="image/*" multiple onChange={(e) => addImages(e.target.files)} /></label>{detail.images.map((img) => <div key={img.id} className="asset-row"><img src={img.thumb_path || img.file_path} alt={img.filename} /><div className="asset-main"><b>{img.filename}</b><p>{img.role} · 第 {img.page_index + 1} 张 · {img.width || "?"}×{img.height || "?"}</p><code>{img.file_path}</code></div><div className="asset-actions"><label className="small-btn">替换<input type="file" accept="image/*" onChange={(e) => doReplaceImage(img.id, e.target.files)} /></label><button className="small-danger-btn" onClick={() => doDeleteImage(img.id)}>删除</button></div></div>)}</div>}
          {tab === "meta" && <div className="meta-box">{editing ? <><label>图片标签，逗号分隔<input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} /></label><label>备注<textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label></> : <><p><b>图片标签：</b>{detail.tags.map((x) => x.name).join("，") || "无"}</p><p><b>提示词风格：</b>{detail.prompt?.prompt_style || "未标记"}</p><p><b>语言状态：</b>{detail.prompt?.language_mode || "未标记"}</p><p><b>清洗状态：</b>{detail.prompt?.rewrite_status || "未标记"}</p><p><b>创建时间：</b>{detail.case.created_at}</p><p><b>更新时间：</b>{detail.case.updated_at}</p><p><b>说明：</b>{detail.case.description || "无"}</p></>}</div>}
        </section>
      </div>
    </main>
  );
}
