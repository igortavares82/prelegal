"use client";

import { MarkdownPdfDocument } from "@/lib/markdownPdf";
import DocumentPreview from "./DocumentPreview";

interface GenericPreviewProps {
  document: string;
  documentName: string;
  documentSlug: string;
  values: Record<string, string>;
}

export default function GenericPreview({
  document,
  documentName,
  documentSlug,
  values,
}: GenericPreviewProps) {
  return (
    <DocumentPreview
      markdown={document}
      pdfDocument={<MarkdownPdfDocument markdown={document} title={documentName} />}
      fileName={`${documentName}.pdf`}
      documentSlug={documentSlug}
      defaultTitle={`${documentName} – ${new Date().toLocaleDateString()}`}
      data={values}
    />
  );
}
