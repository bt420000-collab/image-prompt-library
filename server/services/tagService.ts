export const MAIN_IMAGE_TAGS = [
  "信息图表",
  "UI界面",
  "海报排版",
  "插画艺术",
  "写实摄影",
  "建筑空间",
  "品牌标志",
  "人物角色",
  "商品电商",
  "文档出版",
  "历史古风",
  "场景叙事",
  "漫画条漫",
  "趣味配方"
] as const;

const STOP_TAGS = new Set([
  "全部",
  "内置案例",
  "我的案例",
  "未分类",
  "来源署名",
  "builtin",
  "user",
  "en",
  "zh",
  "mixed",
  "unknown",
  "json_protocol",
  "parameter_protocol",
  "short_command",
  "natural"
]);

export function isChineseTagName(name: unknown) {
  return /[\u3400-\u9fff]/.test(String(name || "").trim());
}

export function cleanTagText(name: unknown) {
  return String(name || "")
    .trim()
    .replace(/^#+/, "")
    .replace(/[\s\t]+/g, "")
    .replace(/[|/]+/g, "")
    .slice(0, 24);
}

const TAG_RULES: Array<{ value: string; tests: RegExp[] }> = [
  { value: "漫画条漫", tests: [/条漫/, /漫画/, /分镜/, /webtoon/i] },
  { value: "UI界面", tests: [/界面/, /交互/, /样机/, /网页/, /后台/, /仪表盘/, /社媒/, /直播/] },
  { value: "信息图表", tests: [/信息图/, /图表/, /可视化/, /图解/, /关系图谱/, /流程图/, /知识图/, /学习表/] },
  { value: "海报排版", tests: [/海报/, /版式/, /封面/, /宣传页/, /长图/] },
  { value: "插画艺术", tests: [/插画/, /绘画/, /艺术风格/, /动漫插画/] },
  { value: "写实摄影", tests: [/摄影/, /写实/, /人像/] },
  { value: "建筑空间", tests: [/建筑/, /空间/, /室内/, /展馆/, /场馆/] },
  { value: "品牌标志", tests: [/品牌/, /标志/, /徽标/, /logo/i, /vi/i] },
  { value: "人物角色", tests: [/角色/, /人物/, /设定/, /写真/] },
  { value: "商品电商", tests: [/电商/, /商品/, /包装/, /详情页/, /展示设计/] },
  { value: "文档出版", tests: [/文档/, /出版/, /书籍/, /处方笺/, /小志/, /杂志/] },
  { value: "历史古风", tests: [/历史/, /古风/, /国风/, /诗词/, /长卷/, /节气/] },
  { value: "场景叙事", tests: [/场景/, /叙事/, /电影/, /故事/, /氛围/] },
  { value: "趣味配方", tests: [/综合应用/, /其他应用/, /应用场景/, /案例图/, /图像生成案例/, /趣味/, /脑洞/, /整活/] }
];

export function isMainImageTag(name: unknown) {
  return MAIN_IMAGE_TAGS.includes(String(name || "").trim() as typeof MAIN_IMAGE_TAGS[number]);
}

export function isFunRecipeTag(name: unknown) {
  const text = cleanTagText(name);
  if (!text || STOP_TAGS.has(text)) return false;
  if (!isChineseTagName(text)) return false;
  if (text === "趣味配方") return true;
  if (isMainImageTag(text)) return false;
  return true;
}

export function normalizeImageTag(name: unknown) {
  const text = cleanTagText(name);
  if (!text || STOP_TAGS.has(text)) return "";
  if (!isChineseTagName(text)) return "";

  for (const rule of TAG_RULES) {
    if (rule.tests.some((re) => re.test(text))) return rule.value;
  }

  // 短小中文标签作为子标签保留，前端会收到“趣味配方”下面。
  if (text.length <= 12) return text;

  // 太长的描述型标签不直接塞进左侧，统一收进趣味配方。
  return "趣味配方";
}

export function normalizeImageTags(input: unknown) {
  const raw = Array.isArray(input)
    ? input.map((x) => String(x || ""))
    : String(input || "").split(/[，,;；\n]+/);

  const out: string[] = [];
  for (const item of raw) {
    const tag = normalizeImageTag(item);
    if (tag && !out.includes(tag)) out.push(tag);
  }
  return out.slice(0, 20);
}
