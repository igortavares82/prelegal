"use client";

import { useEffect, useState } from "react";
import { useAuthSession } from "@/lib/authContext";
import { DocumentsError, listDocuments, type SavedDocumentSummary } from "@/lib/documents";

interface MyDocumentsProps {
  documentNames: Record<string, string>;
  onOpen: (summary: SavedDocumentSummary) => void;
}

export default function MyDocuments({ documentNames, onOpen }: MyDocumentsProps) {
  const { token } = useAuthSession();
  const [documents, setDocuments] = useState<SavedDocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listDocuments(token)
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof DocumentsError ? err.message : "Something went wrong.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    );
  }

  if (!documents) {
    return <p className="text-sm text-gray-text">Loading your documents…</p>;
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-gray-text">
        You haven&apos;t saved any documents yet. Create one and click Save to see it here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {documents.map((doc) => (
        <li key={doc.id}>
          <button
            type="button"
            onClick={() => onOpen(doc)}
            className="flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <span className="font-medium text-navy dark:text-zinc-50">{doc.title}</span>
            <span className="text-xs text-gray-text">
              {documentNames[doc.document_slug] ?? doc.document_slug} ·{" "}
              {new Date(doc.created_at).toLocaleString()}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
