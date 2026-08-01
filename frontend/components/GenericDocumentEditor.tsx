"use client";

import { useMemo, useState } from "react";
import { fillGenericDocument } from "@/lib/fillGenericDocument";
import type { GenericDocument } from "@/lib/loadGenericTemplates";
import GenericChat from "./GenericChat";
import GenericForm from "./GenericForm";
import GenericPreview from "./GenericPreview";

interface GenericDocumentEditorProps {
  document: GenericDocument;
}

export default function GenericDocumentEditor({ document }: GenericDocumentEditorProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [chatPending, setChatPending] = useState(false);

  const filled = useMemo(
    () => fillGenericDocument(document.template, values),
    [document.template, values],
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:min-h-0 lg:flex-1 lg:auto-rows-fr lg:grid-cols-2">
      <div className="flex flex-col gap-6 lg:min-h-0 lg:overflow-y-auto">
        <GenericChat
          documentSlug={document.slug}
          documentName={document.name}
          fieldKeys={document.fieldKeys}
          fields={values}
          onFieldsChange={setValues}
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
            <GenericForm
              fieldKeys={document.fieldKeys}
              values={values}
              onChange={setValues}
              disabled={chatPending}
            />
          </div>
        </details>
      </div>
      <div className="lg:min-h-0 lg:overflow-y-auto">
        <GenericPreview document={filled} documentName={document.name} />
      </div>
    </div>
  );
}
