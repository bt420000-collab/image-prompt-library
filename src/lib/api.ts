import type { CaseDetail, CaseListItem, MetaData } from "../types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: options?.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `请求失败：${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchCases(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== "全部") sp.set(k, String(v));
  });
  return request<{ items: CaseListItem[]; total: number; limit: number; offset: number }>(`/api/cases?${sp.toString()}`);
}

export function fetchCase(id: number) {
  return request<CaseDetail>(`/api/cases/${id}`);
}

export function fetchMeta() {
  return request<MetaData>("/api/cases/meta");
}

export function createCase(payload: Record<string, unknown>) {
  return request<{ id: number }>("/api/cases", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function uploadImages(caseId: number, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return request(`/api/cases/${caseId}/images`, {
    method: "POST",
    body: form
  });
}
