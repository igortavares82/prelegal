import { linkSpanRegex, normalizeFieldKey } from "./genericFields";

// Same escaping rationale as fillCoverPage.ts's MARKDOWN_ESCAPABLE: escape
// every ASCII punctuation character unconditionally so user-entered text can
// never be misread as markdown/HTML syntax or break a table's `|` structure.
const MARKDOWN_ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]/g;

function escapeValue(value: string): string {
  return value.trim().replace(/\r?\n/g, " ").replace(MARKDOWN_ESCAPABLE, "\\$&");
}

// Any remaining `<span>` after field substitution is a purely presentational
// hook (e.g. `header_2`/`header_3` numbering, or a bare `id`-only anchor) —
// strip the tag but keep its inner text, the same way fillCoverPage.ts's
// stripSpanTags treats the Mutual NDA's leftover coverpage_link spans.
const ANY_SPAN_RE = /<span[^>]*>([^<]*)<\/span>/g;

/**
 * Fills a generic (non-Mutual-NDA) document's template by substituting
 * collected field values directly into its `*_link` spans, in place, then
 * stripping the tags. Unlike the Mutual NDA, these documents have no
 * separate cover-page file to fill — the Standard Terms text is both the
 * template and the final document.
 */
export function fillGenericDocument(template: string, values: Record<string, string>): string {
  const filled = template.replace(linkSpanRegex(), (match, label: string) => {
    const key = normalizeFieldKey(label);
    const value = values[key]?.trim();
    if (!value) return match; // leave the span as a live-preview placeholder until answered
    const hadPossessiveSuffix = label.trim() !== key;
    return escapeValue(value) + (hadPossessiveSuffix ? "’s" : "");
  });

  return `${filled.replace(ANY_SPAN_RE, "$1").trim()}\n`;
}
