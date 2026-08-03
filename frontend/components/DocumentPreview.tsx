"use client";

import { pdf } from "@react-pdf/renderer";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuthSession } from "@/lib/authContext";
import { DocumentsError, saveDocument } from "@/lib/documents";

type PdfDocumentElement = NonNullable<Parameters<typeof pdf>[0]>;

interface DocumentPreviewProps {
  markdown: string;
  pdfDocument: PdfDocumentElement;
  fileName: string;
  documentSlug: string;
  defaultTitle: string;
  data: Record<string, unknown>;
}

export default function DocumentPreview({
  markdown,
  pdfDocument,
  fileName,
  documentSlug,
  defaultTitle,
  data,
}: DocumentPreviewProps) {
  const { token } = useAuthSession();
  const [title, setTitle] = useState(defaultTitle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);

  async function handleDownload() {
    setIsGenerating(true);
    setPdfError(null);
    try {
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setSaveError("Give the document a name before saving.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setSavedTitle(null);
    try {
      await saveDocument(token, documentSlug, title.trim(), data);
      setSavedTitle(title.trim());
    } catch (err) {
      setSaveError(err instanceof DocumentsError ? err.message : "Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-navy dark:text-zinc-50">Preview</h2>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="document-title">
            Document name
          </label>
          <input
            id="document-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-40 rounded-md border border-zinc-300 px-2 py-1.5 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-zinc-700 dark:bg-zinc-900 sm:w-56"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md border border-brand-purple px-4 py-2 text-sm font-medium text-brand-purple hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-[#602d78] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Generating…" : "Download .pdf"}
          </button>
        </div>
      </div>
      {pdfError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {pdfError}
        </p>
      )}
      {saveError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {saveError}
        </p>
      )}
      {savedTitle && (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          Saved as “{savedTitle}”. Find it under My Documents.
        </p>
      )}
      <p className="text-xs text-gray-text">
        This document is generated as a draft only and does not constitute legal advice. Have
        it reviewed by a licensed attorney before relying on it.
      </p>
      <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
