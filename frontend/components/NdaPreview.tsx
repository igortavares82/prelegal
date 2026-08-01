"use client";

import { MutualNdaPdfDocument } from "@/lib/mutualNdaPdf";
import type { NdaFormData } from "@/lib/types";
import DocumentPreview from "./DocumentPreview";

interface NdaPreviewProps {
  document: string;
  data: NdaFormData;
}

export default function NdaPreview({ document, data }: NdaPreviewProps) {
  return (
    <DocumentPreview
      markdown={document}
      pdfDocument={<MutualNdaPdfDocument markdown={document} />}
      fileName="Mutual-NDA.pdf"
      documentSlug="mutual-nda"
      defaultTitle={`Mutual NDA – ${new Date().toLocaleDateString()}`}
      data={data as unknown as Record<string, unknown>}
    />
  );
}
