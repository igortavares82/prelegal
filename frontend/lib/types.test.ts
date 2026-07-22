import { describe, expect, it } from "vitest";
import { createEmptyFormData, createEmptyParty } from "./types";

describe("createEmptyParty", () => {
  it("returns all fields as empty strings", () => {
    const party = createEmptyParty();
    expect(party).toEqual({
      signature: "",
      printName: "",
      title: "",
      company: "",
      noticeAddress: "",
      date: "",
    });
  });

  it("returns a fresh object each call (no shared mutable reference)", () => {
    const a = createEmptyParty();
    const b = createEmptyParty();
    a.signature = "Jane";
    expect(b.signature).toBe("");
  });
});

describe("createEmptyFormData", () => {
  it("defaults term types to 'expires' with 1 year", () => {
    const data = createEmptyFormData();
    expect(data.mndaTermType).toBe("expires");
    expect(data.mndaTermYears).toBe("1");
    expect(data.confidentialityTermType).toBe("expires");
    expect(data.confidentialityTermYears).toBe("1");
  });

  it("defaults all free-text fields to empty strings", () => {
    const data = createEmptyFormData();
    expect(data.purpose).toBe("");
    expect(data.effectiveDate).toBe("");
    expect(data.governingLaw).toBe("");
    expect(data.jurisdiction).toBe("");
    expect(data.modifications).toBe("");
  });

  it("gives each party its own independent empty object", () => {
    const data = createEmptyFormData();
    data.party1.signature = "Jane";
    expect(data.party2.signature).toBe("");
    expect(data.party1).not.toBe(data.party2);
  });

  it("returns a fresh object each call", () => {
    const a = createEmptyFormData();
    const b = createEmptyFormData();
    a.purpose = "mutated";
    a.party1.signature = "mutated";
    expect(b.purpose).toBe("");
    expect(b.party1.signature).toBe("");
  });
});
