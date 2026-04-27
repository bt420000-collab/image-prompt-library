import type { MetaData } from "../types";

type Props = {
  meta?: MetaData;
  category: string;
  source: string;
  promptStyle: string;
  language: string;
  onChange: (patch: Partial<{ category: string; source: string; promptStyle: string; language: string }>) => void;
};

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="filter-group"><div className="filter-title">{title}</div>{children}</div>;
}

function OptionButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className={`filter-option ${active ? "active" : ""}`} onClick={onClick}>{children}</button>;
}

export function Sidebar({ meta, category, source, promptStyle, language, onChange }: Props) {
  const categories = [{ name: "全部", count: meta?.stats.cases || 0 }, ...(meta?.categories || [])];
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
        <div><b>{meta?.stats.images ?? "..."}</b><span>图片</span></div>
      </div>

      <FilterGroup title="分类">
        {categories.map((x) => (
          <OptionButton key={x.name} active={category === x.name} onClick={() => onChange({ category: x.name })}>
            <span>{x.name || "未标记"}</span><em>{x.count}</em>
          </OptionButton>
        ))}
      </FilterGroup>

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
    </aside>
  );
}
