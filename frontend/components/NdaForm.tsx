"use client";

import type { NdaFormData, PartyDetails } from "@/lib/types";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const fieldWrapClass = "flex flex-col gap-1";
const sectionClass =
  "flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800";
const legendClass = "text-base font-semibold text-zinc-900 dark:text-zinc-50";

export default function NdaForm({ data, onChange }: NdaFormProps) {
  function update<K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) {
    onChange({ ...data, [key]: value });
  }

  function updateParty(
    party: "party1" | "party2",
    field: keyof PartyDetails,
    value: string,
  ) {
    onChange({ ...data, [party]: { ...data[party], [field]: value } });
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <div className={sectionClass}>
        <h2 className={legendClass}>Agreement details</h2>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="purpose">
            Purpose
          </label>
          <textarea
            id="purpose"
            className={inputClass}
            rows={2}
            placeholder="Evaluating whether to enter into a business relationship with the other party."
            value={data.purpose}
            onChange={(e) => update("purpose", e.target.value)}
          />
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="effectiveDate">
            Effective Date
          </label>
          <input
            id="effectiveDate"
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) => update("effectiveDate", e.target.value)}
          />
        </div>

        <fieldset className={fieldWrapClass}>
          <legend className={labelClass}>MNDA Term</legend>
          <span className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mndaTermType"
                checked={data.mndaTermType === "expires"}
                onChange={() => update("mndaTermType", "expires")}
              />
              Expires
            </label>
            <label className="sr-only" htmlFor="mndaTermYears">
              Number of years
            </label>
            <input
              id="mndaTermYears"
              type="number"
              min={1}
              className={`${inputClass} w-20`}
              disabled={data.mndaTermType !== "expires"}
              value={data.mndaTermYears}
              onChange={(e) => update("mndaTermYears", e.target.value)}
            />
            year(s) from Effective Date
          </span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "continues"}
              onChange={() => update("mndaTermType", "continues")}
            />
            Continues until terminated in accordance with the terms of the MNDA
          </label>
        </fieldset>

        <fieldset className={fieldWrapClass}>
          <legend className={labelClass}>Term of Confidentiality</legend>
          <span className="flex items-center gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="confidentialityTermType"
                checked={data.confidentialityTermType === "expires"}
                onChange={() => update("confidentialityTermType", "expires")}
              />
              Expires
            </label>
            <label className="sr-only" htmlFor="confidentialityTermYears">
              Number of years
            </label>
            <input
              id="confidentialityTermYears"
              type="number"
              min={1}
              className={`${inputClass} w-20`}
              disabled={data.confidentialityTermType !== "expires"}
              value={data.confidentialityTermYears}
              onChange={(e) => update("confidentialityTermYears", e.target.value)}
            />
            year(s) from Effective Date
          </span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "perpetuity"}
              onChange={() => update("confidentialityTermType", "perpetuity")}
            />
            In perpetuity
          </label>
        </fieldset>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="governingLaw">
            Governing Law (state)
          </label>
          <input
            id="governingLaw"
            className={inputClass}
            placeholder="Delaware"
            value={data.governingLaw}
            onChange={(e) => update("governingLaw", e.target.value)}
          />
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="jurisdiction">
            Jurisdiction
          </label>
          <input
            id="jurisdiction"
            className={inputClass}
            placeholder="courts located in New Castle, DE"
            value={data.jurisdiction}
            onChange={(e) => update("jurisdiction", e.target.value)}
          />
        </div>

        <div className={fieldWrapClass}>
          <label className={labelClass} htmlFor="modifications">
            MNDA Modifications <span className="font-normal">(optional)</span>
          </label>
          <textarea
            id="modifications"
            className={inputClass}
            rows={2}
            placeholder="None."
            value={data.modifications}
            onChange={(e) => update("modifications", e.target.value)}
          />
        </div>
      </div>

      <PartySection
        title="Party 1"
        party={data.party1}
        onChange={(field, value) => updateParty("party1", field, value)}
      />
      <PartySection
        title="Party 2"
        party={data.party2}
        onChange={(field, value) => updateParty("party2", field, value)}
      />
    </form>
  );
}

function PartySection({
  title,
  party,
  onChange,
}: {
  title: string;
  party: PartyDetails;
  onChange: (field: keyof PartyDetails, value: string) => void;
}) {
  const idPrefix = title.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={sectionClass}>
      <h2 className={legendClass}>{title}</h2>

      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-signature`}>
          Signature (typed name)
        </label>
        <input
          id={`${idPrefix}-signature`}
          className={inputClass}
          value={party.signature}
          onChange={(e) => onChange("signature", e.target.value)}
        />
      </div>

      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-printName`}>
          Print Name
        </label>
        <input
          id={`${idPrefix}-printName`}
          className={inputClass}
          value={party.printName}
          onChange={(e) => onChange("printName", e.target.value)}
        />
      </div>

      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-title`}>
          Title
        </label>
        <input
          id={`${idPrefix}-title`}
          className={inputClass}
          value={party.title}
          onChange={(e) => onChange("title", e.target.value)}
        />
      </div>

      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-company`}>
          Company
        </label>
        <input
          id={`${idPrefix}-company`}
          className={inputClass}
          value={party.company}
          onChange={(e) => onChange("company", e.target.value)}
        />
      </div>

      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-noticeAddress`}>
          Notice Address (email or postal)
        </label>
        <input
          id={`${idPrefix}-noticeAddress`}
          className={inputClass}
          value={party.noticeAddress}
          onChange={(e) => onChange("noticeAddress", e.target.value)}
        />
      </div>

      <div className={fieldWrapClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-date`}>
          Date
        </label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          className={inputClass}
          value={party.date}
          onChange={(e) => onChange("date", e.target.value)}
        />
      </div>
    </div>
  );
}
