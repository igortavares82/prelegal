import type { NdaFormData } from "./types";

/**
 * Fills in `templates/Mutual-NDA-coverpage.md` with user-supplied values.
 *
 * The source template isn't authored with a generic `{{placeholder}}`
 * syntax, so this works by replacing exact, known anchor strings from the
 * template. If the template changes upstream and an anchor no longer
 * matches, this throws immediately instead of silently shipping a
 * half-filled document.
 */
export function fillCoverPage(template: string, data: NdaFormData): string {
  // Strip the `<label>` hints (e.g. "How Confidential Information may be
  // used") — they're instructions for whoever fills out the Cover Page by
  // hand, which is this form's job now, so they shouldn't appear in the
  // generated document. Two passes: whole-line labels (own line, e.g. under
  // a heading) are removed along with their line; inline labels (e.g. in
  // the "Notice Address" table cell) have just the tag stripped in place.
  let result = template
    .replace(/^<label>.*?<\/label>\n/gm, "")
    .replace(/\s*<label>.*?<\/label>/g, "");

  result = replaceAnchor(
    result,
    "[Evaluating whether to enter into a business relationship with the other party.]",
    "Purpose",
    optionalText(data.purpose),
  );

  result = replaceAnchor(
    result,
    "[Today’s date]",
    "Effective Date",
    data.effectiveDate ? formatDate(data.effectiveDate) : undefined,
  );

  result = fillTermCheckboxes(result, {
    fieldName: "MNDA Term",
    checkedLine: "- [x]     Expires [1 year(s)] from Effective Date.",
    uncheckedLine:
      "- [ ]     Continues until terminated in accordance with the terms of the MNDA.",
    firstOptionSelected: data.mndaTermType === "expires",
    years: data.mndaTermYears,
  });

  result = fillTermCheckboxes(result, {
    fieldName: "Term of Confidentiality",
    checkedLine:
      "- [x]     [1 year(s)] from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.",
    uncheckedLine: "- [ ]     In perpetuity.",
    firstOptionSelected: data.confidentialityTermType === "expires",
    years: data.confidentialityTermYears,
  });

  const governingLaw = optionalText(data.governingLaw);
  result = replaceAnchor(
    result,
    "Governing Law: [Fill in state]",
    "Governing Law",
    governingLaw ? `Governing Law: ${governingLaw}` : undefined,
  );

  const jurisdiction = optionalText(data.jurisdiction);
  result = replaceAnchor(
    result,
    "Jurisdiction: [Fill in city or county and state, i.e. “courts located in New Castle, DE”]",
    "Jurisdiction",
    jurisdiction ? `Jurisdiction: ${jurisdiction}` : undefined,
  );

  result = replaceAnchor(
    result,
    "List any modifications to the MNDA",
    "MNDA Modifications",
    optionalText(data.modifications) ?? "None.",
  );

  const signatureTableAnchor = [
    "|| PARTY 1 | PARTY 2 |",
    "|:--- | :----: | :----: |",
    "| Signature | | |",
    "| Print Name | |",
    "| Title | | |",
    "| Company | | |",
    "| Notice Address | | |",
    "| Date | | |",
  ].join("\n");

  const signatureTableFilled = [
    "|| PARTY 1 | PARTY 2 |",
    "|:--- | :----: | :----: |",
    `| Signature | ${cell(data.party1.signature)} | ${cell(data.party2.signature)} |`,
    `| Print Name | ${cell(data.party1.printName)} | ${cell(data.party2.printName)} |`,
    `| Title | ${cell(data.party1.title)} | ${cell(data.party2.title)} |`,
    `| Company | ${cell(data.party1.company)} | ${cell(data.party2.company)} |`,
    `| Notice Address | ${cell(data.party1.noticeAddress)} | ${cell(data.party2.noticeAddress)} |`,
    `| Date | ${cell(formatOptionalDate(data.party1.date))} | ${cell(formatOptionalDate(data.party2.date))} |`,
  ].join("\n");

  result = replaceAnchor(result, signatureTableAnchor, "Signature table", signatureTableFilled);

  return result;
}

function fillTermCheckboxes(
  template: string,
  opts: {
    fieldName: string;
    checkedLine: string;
    uncheckedLine: string;
    firstOptionSelected: boolean;
    years: string;
  },
): string {
  const years = opts.years?.trim() || "1";
  const firstText = stripCheckbox(opts.checkedLine).replace(
    "[1 year(s)]",
    `${years} year(s)`,
  );
  const secondText = stripCheckbox(opts.uncheckedLine);

  const anchorBlock = `${opts.checkedLine}\n${opts.uncheckedLine}`;
  const filledBlock = [
    `- [${opts.firstOptionSelected ? "x" : " "}]     ${firstText}`,
    `- [${opts.firstOptionSelected ? " " : "x"}]     ${secondText}`,
  ].join("\n");

  return replaceAnchor(template, anchorBlock, opts.fieldName, filledBlock);
}

function stripCheckbox(line: string): string {
  return line.replace(/^- \[[ x]\]\s*/, "");
}

/**
 * Replaces the first occurrence of `anchor` in `template`.
 *
 * `replacement` may be `undefined` to mean "leave the anchor's default text
 * as-is" (used when the user left an optional field blank).
 */
function replaceAnchor(
  template: string,
  anchor: string,
  fieldName: string,
  replacement: string | undefined,
): string {
  if (!template.includes(anchor)) {
    throw new Error(
      `Mutual NDA cover page template is missing the expected "${fieldName}" text. ` +
        "The source template in templates/Mutual-NDA-coverpage.md may have changed.",
    );
  }
  return template.replace(anchor, replacement ?? anchor);
}

/** Escapes markdown table-breaking characters and collapses newlines. */
function cell(value: string): string {
  return cleanText(value).replace(/\|/g, "\\|");
}

function cleanText(value: string): string {
  return value.trim().replace(/\r?\n/g, " ");
}

/** Returns cleaned text, or `undefined` if the input is empty/whitespace-only. */
function optionalText(value: string): string | undefined {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : undefined;
}

function formatDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Like `formatDate`, but passes through an empty signature-date field as-is. */
function formatOptionalDate(isoDate: string): string {
  return isoDate.trim() ? formatDate(isoDate) : "";
}
