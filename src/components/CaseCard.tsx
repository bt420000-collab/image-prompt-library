import { ImageOff } from "lucide-react";
import type { CaseListItem } from "../types";

type Props = {
  item: CaseListItem;
  onOpen: (id: number) => void;
};

export function CaseCard({ item, onOpen }: Props) {
  return (
    <button className="case-card" onClick={() => onOpen(item.id)} title={item.title}>
      <div className="thumb-wrap">
        {item.thumb_path || item.image_path ? (
          <img className="thumb" src={item.thumb_path || item.image_path} alt={item.title} loading="lazy" />
        ) : (
          <div className="thumb-empty"><ImageOff size={28} /></div>
        )}
        <div className="case-badges">
          <span>#{item.case_no}</span>
          {item.image_count > 1 && <span>{item.image_count} 图</span>}
        </div>
      </div>
      <div className="case-info">
        <div className="case-title">{item.title}</div>
        <div className="case-meta">{item.category}</div>
        <div className="case-foot">
          <span>{item.source === "builtin" ? "内置" : "我的"}</span>
          <span>{item.rewrite_status?.includes("optimized") || item.rewrite_status?.includes("normalized") ? "已优化" : "原始"}</span>
        </div>
      </div>
    </button>
  );
}
