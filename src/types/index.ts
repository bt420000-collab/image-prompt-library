export type CaseListItem = {
  id: number;
  case_no: string;
  title: string;
  category: string;
  source: string;
  description: string;
  status: string;
  image_path?: string;
  thumb_path?: string;
  image_count: number;
  prompt_style?: string;
  language_mode?: string;
  rewrite_status?: string;
};

export type CaseImage = {
  id: number;
  case_id: number;
  role: string;
  page_index: number;
  filename: string;
  file_path: string;
  thumb_path: string;
  width?: number;
  height?: number;
  aspect_ratio?: string;
};

export type PromptVersion = {
  id: number;
  case_id: number;
  version_name: string;
  prompt_raw: string;
  prompt_display_cn: string;
  prompt_template_cn: string;
  prompt_engine_cn: string;
  variables_json: string;
  language_mode: string;
  prompt_style: string;
  rewrite_status: string;
  created_at: string;
};

export type CaseDetail = {
  case: {
    id: number;
    case_no: string;
    title: string;
    category: string;
    source: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  images: CaseImage[];
  prompt: PromptVersion;
  versions: Array<Pick<PromptVersion, "id" | "version_name" | "language_mode" | "prompt_style" | "rewrite_status" | "created_at">>;
  tags: { name: string }[];
};

export type MetaData = {
  categories: { name: string; count: number }[];
  sources: { name: string; count: number }[];
  promptStyles: { name: string; count: number }[];
  languages: { name: string; count: number }[];
  stats: { cases: number; images: number; builtin: number; user: number };
};
