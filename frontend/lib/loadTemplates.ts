import { readFile } from "node:fs/promises";
import path from "node:path";

// Templates live in the repo-level `templates/` directory (one level above
// this Next.js app), not copied into `frontend/`, so this repo has a single
// source of truth for the CommonPaper agreement text.
const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

export interface MutualNdaTemplates {
  coverPage: string;
  standardTerms: string;
}

export async function loadMutualNdaTemplates(): Promise<MutualNdaTemplates> {
  const [coverPage, standardTerms] = await Promise.all([
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf-8"),
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf-8"),
  ]);

  return { coverPage, standardTerms };
}
