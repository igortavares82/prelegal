export type MndaTermType = "expires" | "continues";
export type ConfidentialityTermType = "expires" | "perpetuity";

export interface PartyDetails {
  signature: string;
  printName: string;
  title: string;
  company: string;
  noticeAddress: string;
  date: string;
}

export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTermType: MndaTermType;
  mndaTermYears: string;
  confidentialityTermType: ConfidentialityTermType;
  confidentialityTermYears: string;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyDetails;
  party2: PartyDetails;
}

export function createEmptyParty(): PartyDetails {
  return {
    signature: "",
    printName: "",
    title: "",
    company: "",
    noticeAddress: "",
    date: "",
  };
}

export function createEmptyFormData(): NdaFormData {
  return {
    purpose: "",
    effectiveDate: "",
    mndaTermType: "expires",
    mndaTermYears: "1",
    confidentialityTermType: "expires",
    confidentialityTermYears: "1",
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: createEmptyParty(),
    party2: createEmptyParty(),
  };
}
