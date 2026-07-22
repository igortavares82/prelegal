import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fillCoverPage } from "./fillCoverPage";
import { createEmptyFormData, type NdaFormData, type PartyDetails } from "./types";

// Read the real template — testing against a hand-written fixture would let
// this suite drift from the actual contract fillCoverPage has to honor.
// If the template's text ever changes upstream, these tests fail loudly
// alongside fillCoverPage's own runtime throw, which is the point.
const TEMPLATE_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "templates",
  "Mutual-NDA-coverpage.md",
);
const template = readFileSync(TEMPLATE_PATH, "utf-8");

/**
 * Reverses the CommonMark backslash-escaping fillCoverPage applies to
 * free-text fields (see MARKDOWN_ESCAPABLE in fillCoverPage.ts). Use this
 * for assertions about *visible* content — e.g. "does the sentence the user
 * typed appear correctly" — since the raw substituted markdown legitimately
 * contains backslashes before ordinary punctuation like "." and ",".
 * Dedicated escaping tests assert on the raw (still-escaped) string instead.
 */
function unescapeMarkdown(value: string): string {
  return value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, "$1");
}

function party(overrides: Partial<PartyDetails> = {}): PartyDetails {
  return {
    signature: "",
    printName: "",
    title: "",
    company: "",
    noticeAddress: "",
    date: "",
    ...overrides,
  };
}

function formData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return { ...createEmptyFormData(), ...overrides };
}

describe("fillCoverPage", () => {
  describe("template drift protection", () => {
    it("throws a descriptive error when an expected anchor is missing", () => {
      const brokenTemplate = template.replace(
        "[Today’s date]",
        "[some totally different placeholder text]",
      );
      expect(() => fillCoverPage(brokenTemplate, formData())).toThrow(
        /Effective Date/,
      );
    });

    it("error message names the missing field and points at the source file", () => {
      const brokenTemplate = template.replace(
        "Governing Law: [Fill in state]",
        "Governing Law: [somewhere else]",
      );
      let thrown: unknown;
      try {
        fillCoverPage(brokenTemplate, formData());
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toContain("Governing Law");
      expect((thrown as Error).message).toContain("Mutual-NDA-coverpage.md");
    });
  });

  describe("required fields", () => {
    it("substitutes the effective date, formatted", () => {
      const result = fillCoverPage(template, formData({ effectiveDate: "2026-07-20" }));
      expect(result).toContain("July 20, 2026");
      expect(result).not.toContain("[Today’s date]");
    });

    it("passes through an unparseable effective date as-is rather than crashing", () => {
      const result = fillCoverPage(template, formData({ effectiveDate: "not-a-date" }));
      expect(result).toContain("not-a-date");
    });
  });

  describe("optional free-text fields", () => {
    it("substitutes purpose when provided", () => {
      const result = fillCoverPage(
        template,
        formData({ purpose: "Evaluating a joint marketing campaign." }),
      );
      expect(unescapeMarkdown(result)).toContain("Evaluating a joint marketing campaign.");
      expect(result).not.toContain(
        "[Evaluating whether to enter into a business relationship with the other party.]",
      );
    });

    it("leaves the default placeholder text when purpose is empty", () => {
      const result = fillCoverPage(template, formData({ purpose: "" }));
      expect(result).toContain(
        "[Evaluating whether to enter into a business relationship with the other party.]",
      );
    });

    it("treats a whitespace-only purpose the same as empty (not a blank line)", () => {
      const result = fillCoverPage(template, formData({ purpose: "   \n  " }));
      expect(result).toContain(
        "[Evaluating whether to enter into a business relationship with the other party.]",
      );
    });

    it("substitutes governing law with its label prefix", () => {
      const result = fillCoverPage(template, formData({ governingLaw: "Delaware" }));
      expect(result).toContain("Governing Law: Delaware");
    });

    it("leaves the governing law placeholder untouched when empty", () => {
      const result = fillCoverPage(template, formData({ governingLaw: "" }));
      expect(result).toContain("Governing Law: [Fill in state]");
    });

    it("substitutes jurisdiction with its label prefix", () => {
      const result = fillCoverPage(
        template,
        formData({ jurisdiction: "courts located in New Castle, DE" }),
      );
      expect(unescapeMarkdown(result)).toContain(
        "Jurisdiction: courts located in New Castle, DE",
      );
    });

    it('defaults modifications to "None." when empty', () => {
      const result = fillCoverPage(template, formData({ modifications: "" }));
      expect(result).toContain("None.");
      expect(result).not.toContain("List any modifications to the MNDA");
    });

    it("substitutes modifications when provided", () => {
      const result = fillCoverPage(
        template,
        formData({ modifications: "Section 5 term extended to 2 years." }),
      );
      expect(unescapeMarkdown(result)).toContain("Section 5 term extended to 2 years.");
    });
  });

  describe("MNDA Term checkboxes", () => {
    it('checks "Expires" and substitutes the year count when mndaTermType is "expires"', () => {
      const result = fillCoverPage(
        template,
        formData({ mndaTermType: "expires", mndaTermYears: "3" }),
      );
      expect(result).toContain("- [x]     Expires 3 year(s) from Effective Date.");
      expect(result).toContain(
        "- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
      );
    });

    it('checks "Continues" when mndaTermType is "continues", leaving Expires text (unchecked) with the entered year count', () => {
      const result = fillCoverPage(
        template,
        formData({ mndaTermType: "continues", mndaTermYears: "3" }),
      );
      expect(result).toContain("- [ ]     Expires 3 year(s) from Effective Date.");
      expect(result).toContain(
        "- [x]     Continues until terminated in accordance with the terms of the MNDA.",
      );
    });

    it("defaults to 1 year when mndaTermYears is blank", () => {
      const result = fillCoverPage(template, formData({ mndaTermYears: "" }));
      expect(result).toContain("Expires 1 year(s) from Effective Date.");
    });

    it("defaults to 1 year when mndaTermYears is whitespace-only", () => {
      const result = fillCoverPage(template, formData({ mndaTermYears: "   " }));
      expect(result).toContain("Expires 1 year(s) from Effective Date.");
    });
  });

  describe("Term of Confidentiality checkboxes", () => {
    it('checks the fixed-term option and substitutes years when confidentialityTermType is "expires"', () => {
      const result = fillCoverPage(
        template,
        formData({ confidentialityTermType: "expires", confidentialityTermYears: "5" }),
      );
      expect(result).toContain(
        "- [x]     5 year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
      );
      expect(result).toContain("- [ ]     In perpetuity.");
    });

    it('checks "In perpetuity" when confidentialityTermType is "perpetuity"', () => {
      const result = fillCoverPage(
        template,
        formData({ confidentialityTermType: "perpetuity" }),
      );
      expect(result).toContain("- [x]     In perpetuity.");
      expect(result).toMatch(/- \[ \]\s+1 year\(s\) from Effective Date/);
    });
  });

  describe("signature table", () => {
    it("fills in both parties' details, producing a well-formed 3-column table", () => {
      const result = fillCoverPage(
        template,
        formData({
          party1: party({
            signature: "Jane Smith",
            printName: "Jane Smith",
            title: "CEO",
            company: "Acme Corp",
            noticeAddress: "jane@acme.example",
            date: "2026-07-20",
          }),
          party2: party({
            signature: "John Doe",
            printName: "John Doe",
            title: "COO",
            company: "Beta LLC",
            noticeAddress: "john@beta.example",
            date: "2026-07-21",
          }),
        }),
      );

      const visible = unescapeMarkdown(result);
      expect(visible).toContain("| Signature | Jane Smith | John Doe |");
      expect(visible).toContain("| Print Name | Jane Smith | John Doe |");
      expect(visible).toContain("| Title | CEO | COO |");
      expect(visible).toContain("| Company | Acme Corp | Beta LLC |");
      expect(visible).toContain(
        "| Notice Address | jane@acme.example | john@beta.example |",
      );
      expect(visible).toContain("| Date | July 20, 2026 | July 21, 2026 |");
    });

    it("renders an empty signature date as a blank cell, not 'Invalid Date'", () => {
      const result = fillCoverPage(
        template,
        formData({ party1: party({ date: "" }) }),
      );
      expect(result).toContain("| Date |  |");
      expect(result).not.toContain("Invalid Date");
    });

    it("fixes the source template's malformed 'Print Name' row (missing a trailing '|') into a valid 3-column row", () => {
      const result = fillCoverPage(
        template,
        formData({
          party1: party({ printName: "Jane Smith" }),
          party2: party({ printName: "John Doe" }),
        }),
      );
      const printNameLine = result.split("\n").find((line) => line.startsWith("| Print Name"));
      expect(printNameLine).toBe("| Print Name | Jane Smith | John Doe |");
    });
  });

  describe("markdown/HTML escaping (data-loss regression)", () => {
    it("preserves free text that looks like an HTML tag instead of silently dropping it", () => {
      const result = fillCoverPage(
        template,
        formData({ party1: party({ noticeAddress: "Suite <B>, 123 Main St" }) }),
      );
      // The raw unescaped form must NOT appear, since raw "<B>" is what
      // parses as an HTML tag and vanishes when rendered — but the visible
      // (unescaped) content must round-trip back to what the user typed.
      expect(result).not.toContain("Suite <B>, 123 Main St");
      expect(result).toContain("Suite \\<B\\>\\, 123 Main St");
      expect(unescapeMarkdown(result)).toContain("Suite <B>, 123 Main St");
    });

    it("escapes pipe characters in table cells so they can't break the table structure", () => {
      const result = fillCoverPage(
        template,
        formData({ party1: party({ company: "Foo | Bar" }) }),
      );
      expect(result).toContain("Foo \\| Bar");
    });

    it("escapes markdown emphasis/link syntax in free text fields", () => {
      const result = fillCoverPage(
        template,
        formData({ purpose: "Discussing *bold* claims and [links](evil.example)" }),
      );
      expect(result).toContain(
        "Discussing \\*bold\\* claims and \\[links\\]\\(evil\\.example\\)",
      );
      expect(unescapeMarkdown(result)).toContain(
        "Discussing *bold* claims and [links](evil.example)",
      );
    });

    it("collapses embedded newlines in free text to spaces", () => {
      const result = fillCoverPage(
        template,
        formData({ modifications: "Line one\nLine two" }),
      );
      expect(result).toContain("Line one Line two");
    });
  });

  describe("<label> instruction stripping", () => {
    it("removes standalone <label> hint lines", () => {
      const result = fillCoverPage(template, formData());
      expect(result).not.toContain("<label>");
      expect(result).not.toContain("How Confidential Information may be used");
    });

    it("keeps the heading immediately above a stripped label line intact", () => {
      const result = fillCoverPage(template, formData());
      expect(result).toContain("### Purpose");
      expect(result).toContain("### MNDA Term");
    });
  });
});
