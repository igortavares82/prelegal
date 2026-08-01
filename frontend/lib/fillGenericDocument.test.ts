import { describe, expect, it } from "vitest";
import { fillGenericDocument } from "./fillGenericDocument";

describe("fillGenericDocument", () => {
  it("substitutes a collected value into its matching span and strips the tag", () => {
    const template = `Provider will provide the Service to <span class="coverpage_link">Customer</span>.`;
    const result = fillGenericDocument(template, { Customer: "Acme Corp" });
    expect(result).toContain("Provider will provide the Service to Acme Corp.");
    expect(result).not.toContain("<span");
  });

  it("re-appends a possessive suffix to occurrences that had one, without duplicating the key", () => {
    const template = `<span class="coverpage_link">Customer</span> agrees that <span class="coverpage_link">Customer's</span> data is safe.`;
    const result = fillGenericDocument(template, { Customer: "Acme Corp" });
    expect(result).toContain("Acme Corp agrees that Acme Corp’s data is safe.");
  });

  it("leaves the label text visible as a live-preview placeholder when a field is unanswered", () => {
    const template = `<span class="orderform_link">Subscription Period</span> begins today.`;
    const result = fillGenericDocument(template, {});
    expect(result).toContain("Subscription Period begins today.");
    expect(result).not.toContain("<span");
  });

  it("strips leftover structural spans (header_2/header_3, bare id spans) down to their inner text", () => {
    const template = `1. <span class="header_2" id="1">Service</span>\n\nExcept as <span id="8.1.a">stated</span>.`;
    const result = fillGenericDocument(template, {});
    expect(result).toContain("1. Service");
    expect(result).toContain("Except as stated.");
    expect(result).not.toContain("<span");
  });

  it("escapes markdown-significant characters in a filled value", () => {
    const template = `Notes: <span class="keyterms_link">Notes</span>`;
    const result = fillGenericDocument(template, { Notes: "Suite <B>, 123 Main St" });
    expect(result).toContain("Suite \\<B\\>\\, 123 Main St");
  });

  it("collapses newlines in a filled value to a single space", () => {
    const template = `<span class="keyterms_link">Address</span>`;
    const result = fillGenericDocument(template, { Address: "Line 1\nLine 2" });
    expect(result).toContain("Line 1 Line 2");
  });
});
