import { readFile } from "node:fs/promises";
import path from "node:path";
import { deriveGenericFields } from "./genericFields";
import { loadCatalog, selectableEntries } from "./loadCatalog";

const REPO_ROOT = path.join(process.cwd(), "..");

export interface GenericDocument {
  slug: string;
  name: string;
  description: string;
  template: string;
  fieldKeys: string[];
}

/**
 * Loads every selectable document type except the Mutual NDA (which has its
 * own dedicated pipeline — see loadTemplates.ts) and derives each one's
 * fill-in field list from its template text.
 */
export async function loadGenericDocuments(): Promise<GenericDocument[]> {
  const catalog = await loadCatalog();
  const entries = selectableEntries(catalog).filter((entry) => entry.slug !== "mutual-nda");

  return Promise.all(
    entries.map(async (entry) => {
      const template = await readFile(path.join(REPO_ROOT, entry.filename), "utf-8");
      return {
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
        template,
        fieldKeys: deriveGenericFields(template),
      };
    }),
  );
}
