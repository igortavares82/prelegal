"use client";

import { useMemo, useState } from "react";
import { buildMutualNdaDocument } from "@/lib/buildDocument";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import { createEmptyFormData } from "@/lib/types";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";

interface NdaEditorProps {
  templates: MutualNdaTemplates;
}

export default function NdaEditor({ templates }: NdaEditorProps) {
  const [data, setData] = useState(createEmptyFormData);

  const document = useMemo(() => {
    try {
      return buildMutualNdaDocument(templates, data);
    } catch (error) {
      return `Unable to render document: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  }, [templates, data]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <NdaForm data={data} onChange={setData} />
      <div className="lg:sticky lg:top-8 lg:self-start">
        <NdaPreview document={document} />
      </div>
    </div>
  );
}
