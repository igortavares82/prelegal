import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMutualNdaTemplates } from "./loadTemplates";

// loadMutualNdaTemplates resolves paths from process.cwd(), which for both
// `next dev`/`next build` and `vitest run` (via the "test" npm script) is
// the frontend/ package root — so this test exercises the same path
// resolution used at runtime, not a mock of it.
const TEMPLATES_DIR = path.join(import.meta.dirname, "..", "..", "templates");

describe("loadMutualNdaTemplates", () => {
  it("reads both template files from the repo-level templates/ directory", async () => {
    const templates = await loadMutualNdaTemplates();

    expect(templates.coverPage).toEqual(
      readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf-8"),
    );
    expect(templates.standardTerms).toEqual(
      readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf-8"),
    );
  });

  it("returns non-trivial content for both files (sanity check against silent empty reads)", async () => {
    const templates = await loadMutualNdaTemplates();
    expect(templates.coverPage.length).toBeGreaterThan(500);
    expect(templates.standardTerms.length).toBeGreaterThan(500);
  });

  it("returns recognizable markers from each document", async () => {
    const templates = await loadMutualNdaTemplates();
    expect(templates.coverPage).toContain("# Mutual Non-Disclosure Agreement");
    expect(templates.standardTerms).toContain("# Standard Terms");
  });
});
