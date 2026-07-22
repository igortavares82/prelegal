import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildMutualNdaDocument } from "./buildDocument";
import { createEmptyFormData } from "./types";

const TEMPLATES_DIR = path.join(import.meta.dirname, "..", "..", "templates");
const coverPage = readFileSync(
  path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"),
  "utf-8",
);
const standardTerms = readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf-8");

describe("buildMutualNdaDocument", () => {
  it("combines the filled cover page and standard terms with a horizontal-rule separator", () => {
    const result = buildMutualNdaDocument(
      { coverPage, standardTerms },
      createEmptyFormData(),
    );
    expect(result).toContain("# Mutual Non-Disclosure Agreement");
    expect(result).toContain("\n\n---\n\n");
    expect(result).toContain("# Standard Terms");

    const coverPageIndex = result.indexOf("# Mutual Non-Disclosure Agreement");
    const separatorIndex = result.indexOf("---");
    const standardTermsIndex = result.indexOf("# Standard Terms");
    expect(coverPageIndex).toBeLessThan(separatorIndex);
    expect(separatorIndex).toBeLessThan(standardTermsIndex);
  });

  it("strips coverpage_link span tags from the standard terms, keeping the inner text", () => {
    expect(standardTerms).toContain('<span class="coverpage_link">');

    const result = buildMutualNdaDocument(
      { coverPage, standardTerms },
      createEmptyFormData(),
    );
    expect(result).not.toContain("coverpage_link");
    expect(result).not.toContain("<span");
    // A defined term that's wrapped in a span in the source should survive
    // as plain text.
    expect(result).toContain("Confidential Information solely for the Purpose");
  });

  it("does not mangle standard-terms content outside of span tags", () => {
    const result = buildMutualNdaDocument(
      { coverPage, standardTerms },
      createEmptyFormData(),
    );
    expect(result).toContain(
      "Neither party has an obligation under this MNDA to disclose Confidential Information",
    );
  });

  it("trims leading/trailing whitespace from each section before joining", () => {
    const result = buildMutualNdaDocument(
      { coverPage: `\n\n${coverPage}\n\n`, standardTerms: `\n\n${standardTerms}\n\n` },
      createEmptyFormData(),
    );
    expect(result.startsWith("\n")).toBe(false);
    expect(result).not.toContain("\n\n\n\n");
  });
});
