import { getApiBaseUrl } from "./apiBase";

export interface SavedDocumentSummary {
  id: number;
  document_slug: string;
  title: string;
  created_at: string;
}

export interface SavedDocument extends SavedDocumentSummary {
  data: Record<string, unknown>;
}

export class DocumentsError extends Error {}

async function authorizedFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new DocumentsError(
      "Something went wrong with your saved documents. Please try again.",
    );
  }
  return response;
}

export async function saveDocument(
  token: string,
  documentSlug: string,
  title: string,
  data: Record<string, unknown>,
): Promise<SavedDocument> {
  const response = await authorizedFetch("/api/documents", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_slug: documentSlug, title, data }),
  });
  return response.json();
}

export async function listDocuments(token: string): Promise<SavedDocumentSummary[]> {
  const response = await authorizedFetch("/api/documents", token);
  return response.json();
}

export async function getDocument(token: string, id: number): Promise<SavedDocument> {
  const response = await authorizedFetch(`/api/documents/${id}`, token);
  return response.json();
}
