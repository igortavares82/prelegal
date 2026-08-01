import { readFile } from "node:fs/promises";
import path from "node:path";

// catalog.json lives at the repo root (one level above this Next.js app),
// same place templates/ lives — see loadTemplates.ts.
const CATALOG_PATH = path.join(process.cwd(), "..", "catalog.json");

export interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
  slug?: string;
}

export async function loadCatalog(): Promise<CatalogEntry[]> {
  const raw = await readFile(CATALOG_PATH, "utf-8");
  return JSON.parse(raw) as CatalogEntry[];
}

/** Catalog entries that are themselves a document a user can request. */
export function selectableEntries(
  catalog: CatalogEntry[],
): (CatalogEntry & { slug: string })[] {
  return catalog.filter((entry): entry is CatalogEntry & { slug: string } => Boolean(entry.slug));
}
