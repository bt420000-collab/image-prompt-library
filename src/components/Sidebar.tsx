import type { MetaData } from "../types";

type Props = {
  meta?: MetaData;
  tag: string;
  funSubTag: string;
  source: string;
  promptStyle: string;
  language: string;
  onChange: (patch: Partial<{ tag: string; funSubTag: string; source: string; promptStyle: string; language: string }>) => void;
};

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="filter-group"><div className="filter-title">{title}</div>{children}</div>;
}

function OptionButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className={`filter-option ${active ? "active" : ""}`} onClick={onClick}>{children}</button>;
}

export function Sidebar({ meta, tag, funSubTag, source, promptStyle, language, onChange }: Props) {
  const tags = [{ name: "全部", count: meta?.stats.cases || 0 }, ...((meta?.tags || []).filter((x) => /[\u3400-\u9fff]/.test(x.name)))];
  const funSubTags = meta?.funSubTags || [];
  const sources = [{ name: "全部", count: meta?.stats.cases || 0 }, ...(meta?.sources || [])];
  const styles = [{ name: "全部", count: meta?.stats.cases || 0 }, ...(meta?.promptStyles || [])];
  const languages = [{ name: "全部", count: meta?.stats.cases || 0 }, ...(meta?.languages || [])];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">图</div>
        <div>
          <div className="brand-title">图像配方库</div>
          <div className="brand-subtitle">ImagePrompt Library</div>
        </div>
      </div>

      <div className="stats">
        <div><b>{meta?.stats.cases ?? "..."}</b><span>案例</span></div>
        <div><b>{meta?.stats.tags ?? "..."}</b><span>标签</span></div>
      </div>

      <FilterGroup title="图片主标签">
        {tags.map((x) => (
          <OptionButton
            key={x.name}
            active={tag === x.name && (x.name !== "趣味配方" || funSubTag === "全部")}
            onClick={() => onChange({ tag: x.name, funSubTag: "全部" })}
          >
            <span>{x.name || "未标记"}</span><em>{x.count}</em>
          </OptionButton>
        ))}
      </FilterGroup>

      {tag === "趣味配方" && funSubTags.length > 0 && (
        <FilterGroup title="趣味子标签">
          <OptionButton active={funSubTag === "全部"} onClick={() => onChange({ tag: "趣味配方", funSubTag: "全部" })}>
            <span>全部趣味配方</span><em>{tags.find((x) => x.name === "趣味配方")?.count || 0}</em>
          </OptionButton>
          {funSubTags.slice(0, 28).map((x) => (
            <OptionButton key={x.name} active={funSubTag === x.name} onClick={() => onChange({ tag: "趣味配方", funSubTag: x.name })}>
              <span>{x.name}</span><em>{x.count}</em>
            </OptionButton>
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="来源">
        {sources.map((x) => (
          <OptionButton key={x.name} active={source === x.name} onClick={() => onChange({ source: x.name })}>
            <span>{x.name === "builtin" ? "内置案例" : x.name === "user" ? "我的案例" : x.name}</span><em>{x.count}</em>
          </OptionButton>
        ))}
      </FilterGroup>

      <FilterGroup title="提示词类型">
        {styles.slice(0, 8).map((x) => (
          <OptionButton key={x.name} active={promptStyle === x.name} onClick={() => onChange({ promptStyle: x.name })}>
            <span>{x.name || "未标记"}</span><em>{x.count}</em>
          </OptionButton>
        ))}
      </FilterGroup>

      <FilterGroup title="语言">
        {languages.map((x) => (
          <OptionButton key={x.name} active={language === x.name} onClick={() => onChange({ language: x.name })}>
            <span>{x.name || "未标记"}</span><em>{x.count}</em>
          </OptionButton>
        ))}
      </FilterGroup>

      <div className="sidebar-footer">
        <div className="author-signature">贝丝小草｜专注于解决问题的艺术</div>
        <a href="https://space.bilibili.com/16826253" target="_blank" rel="noreferrer">B站主页 / 使用教学</a>
      </div>

    </aside>
  );
}
