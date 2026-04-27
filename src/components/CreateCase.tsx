import { useState } from "react";
import { createCase, uploadImages } from "../lib/api";

type Props = {
  onDone: (id?: number) => void;
};

export function CreateCase({ onDone }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    title: "",
    category: "我的案例",
    description: "",
    prompt_raw: "",
    prompt_display_cn: "",
    prompt_template_cn: ""
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const result = await createCase(form);
      if (files.length) await uploadImages(result.id, files);
      onDone(result.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="create-page">
      <header className="detail-header">
        <button className="ghost-btn" onClick={() => onDone()}>返回</button>
        <div>
          <h1>新增案例</h1>
          <p>第一版先手动维护，后续可接 AI 自动转展示版和模板版。</p>
        </div>
      </header>

      <div className="form-card">
        <label>标题<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="例如：云南菌子戏班海报" /></label>
        <label>分类<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
        <label>备注<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>上传样板图，可多张<input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} /></label>
        <label>展示说明<textarea value={form.prompt_display_cn} onChange={(e) => setForm({ ...form, prompt_display_cn: e.target.value })} /></label>
        <label>填空模板<textarea value={form.prompt_template_cn} onChange={(e) => setForm({ ...form, prompt_template_cn: e.target.value })} /></label>
        <label>原始提示词<textarea value={form.prompt_raw} onChange={(e) => setForm({ ...form, prompt_raw: e.target.value })} /></label>
        <button className="primary-btn" onClick={submit} disabled={saving || !form.title}>{saving ? "保存中..." : "保存案例"}</button>
      </div>
    </main>
  );
}
