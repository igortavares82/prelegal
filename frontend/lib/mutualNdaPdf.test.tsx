// @vitest-environment node
//
// PDF generation only needs Node APIs (no DOM), and @react-pdf/renderer's
// Node-side rendering path is a closer match to how this component will
// actually behave than routing it through jsdom's browser-ish globals.

import { readFileSync } from "node:fs";
import path from "node:path";
import { pdf } from "@react-pdf/renderer";
import { PDFParse } from "pdf-parse";
import { describe, expect, it } from "vitest";
import { buildMutualNdaDocument } from "./buildDocument";
import { MutualNdaPdfDocument } from "./mutualNdaPdf";
import { createEmptyFormData, type NdaFormData } from "./types";

const TEMPLATES_DIR = path.join(import.meta.dirname, "..", "..", "templates");
const templates = {
  coverPage: readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf-8"),
  standardTerms: readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf-8"),
};

async function renderPdfText(markdown: string) {
  const stream = await pdf(<MutualNdaPdfDocument markdown={markdown} />).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer);
  }
  const buffer = Buffer.concat(chunks);

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  return { buffer, text: result.text, pageCount: result.total };
}

function sampleFormData(): NdaFormData {
  return {
    ...createEmptyFormData(),
    purpose: "Evaluating a potential software integration partnership.",
    effectiveDate: "2026-07-20",
    mndaTermType: "expires",
    mndaTermYears: "2",
    confidentialityTermType: "perpetuity",
    confidentialityTermYears: "1",
    governingLaw: "Delaware",
    jurisdiction: "courts located in New Castle, DE",
    modifications: "None.",
    party1: {
      signature: "Jane Smith",
      printName: "Jane Smith",
      title: "CEO",
      company: "Acme Corp",
      noticeAddress: "jane@acme.example",
      date: "2026-07-20",
    },
    party2: {
      signature: "John Doe",
      printName: "John Doe",
      title: "COO",
      company: "Beta LLC",
      noticeAddress: "john@beta.example",
      date: "2026-07-20",
    },
  };
}

describe("MutualNdaPdfDocument", () => {
  it("produces a well-formed PDF (valid magic bytes) for the full assembled document", async () => {
    const markdown = buildMutualNdaDocument(templates, sampleFormData());
    const { buffer } = await renderPdfText(markdown);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });

  it("renders every field from the form into extractable, searchable text", async () => {
    const markdown = buildMutualNdaDocument(templates, sampleFormData());
    const { text } = await renderPdfText(markdown);
    const normalized = text.replace(/\s+/g, " ");

    expect(normalized).toContain(
      "Evaluating a potential software integration partnership.",
    );
    expect(normalized).toContain("July 20, 2026");
    expect(normalized).toContain("2 year(s) from Effective Date");
    expect(normalized).toContain("In perpetuity");
    expect(normalized).toContain("Governing Law: Delaware");
    expect(normalized).toContain("courts located in New Castle, DE");
    expect(normalized).toContain("Jane Smith");
    expect(normalized).toContain("John Doe");
    expect(normalized).toContain("Acme Corp");
    expect(normalized).toContain("Beta LLC");
  });

  it("renders both the cover page and the full Standard Terms body", async () => {
    const markdown = buildMutualNdaDocument(templates, sampleFormData());
    const { text } = await renderPdfText(markdown);
    const normalized = text.replace(/\s+/g, " ");

    expect(normalized).toContain("Mutual Non-Disclosure Agreement");
    expect(normalized).toContain("Standard Terms");
    expect(normalized).toContain("Introduction");
    // The 11-item ordered list in Standard Terms should number correctly,
    // not restart or skip (see mutualNdaPdf.tsx's renderListItem marker
    // calculation, `(parent.start ?? 1) + index`).
    expect(normalized).toContain("General");
    expect(normalized).toMatch(/11\.\s*General/);
  });

  it("does not leak raw markdown/HTML syntax into the rendered text", async () => {
    const markdown = buildMutualNdaDocument(templates, sampleFormData());
    const { text } = await renderPdfText(markdown);

    expect(text).not.toContain("<label>");
    expect(text).not.toContain("coverpage_link");
    expect(text).not.toContain("<span");
  });

  it("preserves free text shaped like an HTML tag rather than dropping it (escaping regression)", async () => {
    const data = sampleFormData();
    data.party1.noticeAddress = "Suite <B>, 123 Main St";
    const markdown = buildMutualNdaDocument(templates, data);

    const { text } = await renderPdfText(markdown);
    const normalized = text.replace(/\s+/g, " ");
    expect(normalized).toContain("Suite <B>, 123 Main St");
  });

  it("renders the GFM checkbox list with the correct option checked", async () => {
    const data = sampleFormData();
    data.mndaTermType = "continues";
    const markdown = buildMutualNdaDocument(templates, data);

    const { text } = await renderPdfText(markdown);
    const normalized = text.replace(/\s+/g, " ");
    expect(normalized).toMatch(/\[x\]\s*Continues until terminated/);
    // The (unselected) "Expires" option still shows the entered year count,
    // just unchecked — see fillCoverPage.ts's fillTermCheckboxes.
    expect(normalized).toMatch(/\[ \]\s*Expires 2 year\(s\)/);
  });

  it("renders a multi-page PDF for the full document (cover page + 11-section standard terms)", async () => {
    const markdown = buildMutualNdaDocument(templates, sampleFormData());
    const { pageCount } = await renderPdfText(markdown);
    expect(pageCount).toBeGreaterThan(1);
  });
});
