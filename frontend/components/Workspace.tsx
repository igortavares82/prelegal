"use client";

import { useState } from "react";
import { useAuthSession } from "@/lib/authContext";
import { getDocument, type SavedDocumentSummary } from "@/lib/documents";
import type { GenericDocument } from "@/lib/loadGenericTemplates";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import DocumentChat from "./DocumentChat";
import MyDocuments from "./MyDocuments";

interface WorkspaceProps {
  mutualNdaTemplates: MutualNdaTemplates;
  genericDocuments: GenericDocument[];
  documentNames: Record<string, string>;
  documentCount: number;
}

type View =
  | { kind: "new" }
  | { kind: "documents" }
  | { kind: "reopen"; id: number; slug: string; data: unknown };

export default function Workspace({
  mutualNdaTemplates,
  genericDocuments,
  documentNames,
  documentCount,
}: WorkspaceProps) {
  const { token } = useAuthSession();
  const [view, setView] = useState<View>({ kind: "new" });
  const [openError, setOpenError] = useState<string | null>(null);

  async function handleOpen(summary: SavedDocumentSummary) {
    setOpenError(null);
    try {
      const full = await getDocument(token, summary.id);
      setView({ kind: "reopen", id: full.id, slug: full.document_slug, data: full.data });
    } catch {
      setOpenError("Couldn't open that document. Please try again.");
    }
  }

  const isNewDocumentView = view.kind !== "documents";

  return (
    <>
      <header className="flex flex-col gap-2 lg:shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-navy dark:text-zinc-50">
            Legal Document Creator
          </h1>
          <nav className="flex gap-4 text-sm font-medium" aria-label="Workspace views">
            <button
              type="button"
              onClick={() => setView({ kind: "new" })}
              className={isNewDocumentView ? "text-brand-purple" : "text-brand-blue hover:underline"}
            >
              + New document
            </button>
            <button
              type="button"
              onClick={() => setView({ kind: "documents" })}
              className={
                view.kind === "documents" ? "text-brand-purple" : "text-brand-blue hover:underline"
              }
            >
              My documents
            </button>
          </nav>
        </div>
        <p className="max-w-2xl text-sm text-gray-text">
          Chat with our assistant to figure out which of our {documentCount} supported Common
          Paper agreement types you need, then fill it in. The preview updates as you answer, and
          you can download the completed document as a PDF.
        </p>
      </header>
      {view.kind === "documents" ? (
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {openError && (
            <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
              {openError}
            </p>
          )}
          <MyDocuments documentNames={documentNames} onOpen={handleOpen} />
        </div>
      ) : (
        <DocumentChat
          key={view.kind === "reopen" ? `reopen-${view.id}` : "new"}
          mutualNdaTemplates={mutualNdaTemplates}
          genericDocuments={genericDocuments}
          initialSlug={view.kind === "reopen" ? view.slug : undefined}
          initialData={view.kind === "reopen" ? view.data : undefined}
        />
      )}
    </>
  );
}
