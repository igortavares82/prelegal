import { describe, expect, it } from "vitest";
import { deriveGenericFields, normalizeFieldKey } from "./genericFields";

describe("normalizeFieldKey", () => {
  it("strips a straight-apostrophe possessive suffix", () => {
    expect(normalizeFieldKey("Customer's")).toBe("Customer");
  });

  it("strips a curly-apostrophe possessive suffix", () => {
    expect(normalizeFieldKey("Customer’s")).toBe("Customer");
  });

  it("leaves a bare term unchanged", () => {
    expect(normalizeFieldKey("Customer")).toBe("Customer");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeFieldKey("  Customer  ")).toBe("Customer");
  });

  it("leaves an unrelated plural unchanged", () => {
    expect(normalizeFieldKey("Subscription Periods")).toBe("Subscription Periods");
  });
});

describe("deriveGenericFields", () => {
  it("extracts field labels from *_link spans, in first-appearance order", () => {
    const template = `
1. <span class="header_2" id="1">Service</span>

Provider will provide the Service to <span class="coverpage_link">Customer</span>.

<span class="orderform_link">Subscription Period</span> begins on the <span class="orderform_link">Order Date</span>.
`;
    expect(deriveGenericFields(template)).toEqual([
      "Customer",
      "Subscription Period",
      "Order Date",
    ]);
  });

  it("dedupes a bare term against its possessive form, keeping the first-seen key", () => {
    const template = `
<span class="coverpage_link">Customer</span> agrees that <span class="coverpage_link">Customer's</span> data is safe.
`;
    expect(deriveGenericFields(template)).toEqual(["Customer"]);
  });

  it("ignores structural header_2/header_3 spans", () => {
    const template = `<span class="header_2" id="1">Definitions</span> and <span class="header_3" id="1.1">Scope</span>.`;
    expect(deriveGenericFields(template)).toEqual([]);
  });

  it("ignores bare spans with no class attribute", () => {
    const template = `Except as <span id="8.1.a">stated</span>, nothing applies.`;
    expect(deriveGenericFields(template)).toEqual([]);
  });

  it("treats an id-attributed link span the same as one without an id", () => {
    const template = `<span class="coverpage_link" id="5.5.a">Customer</span> and <span class="coverpage_link">Provider</span>.`;
    expect(deriveGenericFields(template)).toEqual(["Customer", "Provider"]);
  });

  it("returns an empty list for a template with no link spans", () => {
    expect(deriveGenericFields("Just plain text.")).toEqual([]);
  });
});
