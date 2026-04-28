import { useEffect, useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { fetchCases, fetchMeta } from "./lib/api";
import type { CaseListItem, MetaData } from "./types";
import { Sidebar } from "./components/Sidebar";
import { CaseCard } from "./components/CaseCard";
import { CaseDetail } from "./components/CaseDetail";
import { CreateCase } from "./components/CreateCase";

type Page = { name: "gallery" } | { name: "detail"; id: number } | { name: "create" };

export default function App() {
  const [page, setPage] = useState<Page>({ name: "gallery" });
  const [items, setItems] = useState<CaseListItem[]>([]);
  const [meta, setMeta] = useState<MetaData>();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("全部");
  const [funSubTag, setFunSubTag] = useState("全部");
  const [source, setSource] = useState("全部");
  const [promptStyle, setPromptStyle] = useState("全部");
  const [language, setLanguage] = useState("全部");
  const [loading, setLoading] = useState(false);

  const queryParams = useMemo(() => ({ q, tag: tag === "趣味配方" && funSubTag !== "全部" ? funSubTag : tag, tag_group: tag === "趣味配方" && funSubTag === "全部" ? "fun" : undefined, source, prompt_style: promptStyle, language_mode: language, limit: 160 }), [q, tag, funSubTag, source, promptStyle, language]);

  async function reload() {
    setLoading(true);
    try {
      const [caseRes, metaRes] = await Promise.all([fetchCases(queryParams), fetchMeta()]);
      setItems(caseRes.items);
      setMeta(metaRes);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (page.name === "gallery") reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.name, queryParams]);

  if (page.name === "detail") return <CaseDetail id={page.id} onBack={() => setPage({ name: "gallery" })} />;
  if (page.name === "create") return <CreateCase onDone={(id) => setPage(id ? { name: "detail", id } : { name: "gallery" })} />;

  return (
    <div className="app-shell">
      <Sidebar
        meta={meta}
        tag={tag}
        funSubTag={funSubTag}
        source={source}
        promptStyle={promptStyle}
        language={language}
        onChange={(patch) => {
          if (patch.tag !== undefined) setTag(patch.tag);
          if (patch.funSubTag !== undefined) setFunSubTag(patch.funSubTag);
          if (patch.source !== undefined) setSource(patch.source);
          if (patch.promptStyle !== undefined) setPromptStyle(patch.promptStyle);
          if (patch.language !== undefined) setLanguage(patch.language);
        }}
      />

      <main className="gallery-page">
        <header className="topbar">
          <div className="search-box">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索编号、标题、分类、提示词内容，例如：#18 / 信息图 / 直播界面" />
            {q && <button onClick={() => setQ("")}><X size={16} /></button>}
          </div>
          <button className="primary-btn" onClick={() => setPage({ name: "create" })}><Plus size={18} /> 新增案例</button>
        </header>

        <section className="gallery-head">
          <div>
            <h1>案例图库</h1>
            <p>{loading ? "正在整理抽屉..." : `当前显示 ${items.length} 个案例`}</p>
          </div>
          <div className="active-filters">
            {[tag, funSubTag, source, promptStyle, language].filter((x) => x && x !== "全部").map((x) => <span key={x}>{x}</span>)}
          </div>
        </section>

        <section className="case-grid">
          {items.map((item) => (
            <CaseCard key={item.id} item={item} onOpen={(id) => setPage({ name: "detail", id })} />
          ))}
        </section>

        {!loading && !items.length && (
          <div className="empty-state">没找到案例，换个关键词试试。</div>
        )}
      </main>
    </div>
  );
}
