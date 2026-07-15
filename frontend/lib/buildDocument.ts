import { fillCoverPage } from "./fillCoverPage";
import type { MutualNdaTemplates } from "./loadTemplates";
import type { NdaFormData } from "./types";

/**
 * Removes the `coverpage_link` `<span>` styling hooks from the Standard
 * Terms, keeping the inner defined-term text (e.g. "Purpose"). Those spans
 * are presentational in the source template, not fill-in blanks.
 */
function stripSpanTags(markdown: string): string {
  return markdown.replace(/<span class="[^"]*">([^<]*)<\/span>/g, "$1");
}

export function buildMutualNdaDocument(
  templates: MutualNdaTemplates,
  data: NdaFormData,
): string {
  const filledCoverPage = fillCoverPage(templates.coverPage, data);
  const cleanedStandardTerms = stripSpanTags(templates.standardTerms);

  return `${filledCoverPage.trim()}\n\n---\n\n${cleanedStandardTerms.trim()}\n`;
}
