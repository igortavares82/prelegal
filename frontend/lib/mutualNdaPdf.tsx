import { MarkdownPdfDocument } from "./markdownPdf";

interface MutualNdaPdfDocumentProps {
  markdown: string;
}

/** Renders the assembled Mutual NDA markdown (see lib/buildDocument.ts) as a PDF. */
export function MutualNdaPdfDocument({ markdown }: MutualNdaPdfDocumentProps) {
  return <MarkdownPdfDocument markdown={markdown} title="Mutual Non-Disclosure Agreement" />;
}
