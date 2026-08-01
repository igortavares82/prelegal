// Templates for document types other than the Mutual NDA reference their
// fill-in variables inline via `<span class="X_link">Label</span>` tags
// (the class prefix varies by document: orderform_link, keyterms_link,
// sow_link, businessterms_link, coverpage_link) rather than through a
// separate cover-page document. This derives the field list for a document
// straight from that markup, so there's no need to hand-author a schema per
// document type.
const LINK_SPAN_PATTERN = '<span class="[a-z]+_link"(?:\\s+id="[^"]*")?>([^<]*)</span>';

export function linkSpanRegex(): RegExp {
  return new RegExp(LINK_SPAN_PATTERN, "g");
}

/**
 * The same defined term sometimes appears both bare ("Customer") and in a
 * possessive form ("Customer's" / "Customer's") across a template. Without
 * normalizing, those would surface as separate fields asking the same
 * underlying question twice.
 */
export function normalizeFieldKey(label: string): string {
  return label.trim().replace(/['’]s$/u, "");
}

/** Derives, in first-appearance order, the field keys a document needs. */
export function deriveGenericFields(template: string): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const match of template.matchAll(linkSpanRegex())) {
    const key = normalizeFieldKey(match[1]);
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}
