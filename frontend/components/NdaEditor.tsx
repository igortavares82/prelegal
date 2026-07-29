"use client";

import { useMemo, useState } from "react";
import { buildMutualNdaDocument } from "@/lib/buildDocument";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import { createEmptyFormData } from "@/lib/types";
import NdaChat from "./NdaChat";
import NdaForm from "./NdaForm";
import NdaPreview from "./NdaPreview";

interface NdaEditorProps {
  templates: MutualNdaTemplates;
}

export default function NdaEditor({ templates }: NdaEditorProps) {
  const [data, setData] = useState(createEmptyFormData);
  const [chatPending, setChatPending] = useState(false);

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
    <div className="grid grid-cols-1 gap-8 lg:min-h-0 lg:flex-1 lg:auto-rows-fr lg:grid-cols-2">
      <div className="flex flex-col gap-6 lg:min-h-0 lg:overflow-y-auto">
        <NdaChat
          fields={data}
          onFieldsChange={setData}
          onPendingChange={setChatPending}
        />
        <details
          open
          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Review & edit details manually
          </summary>
          <div className="mt-4">
            <NdaForm data={data} onChange={setData} disabled={chatPending} />
          </div>
        </details>
      </div>
      <div className="lg:min-h-0 lg:overflow-y-auto">
        <NdaPreview document={document} />
      </div>
    </div>
  );
}
