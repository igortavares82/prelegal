"use client";

import { pdf } from "@react-pdf/renderer";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownPdfDocument } from "@/lib/markdownPdf";

interface GenericPreviewProps {
  document: string;
  documentName: string;
}

export default function GenericPreview({ document, documentName }: GenericPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsGenerating(true);
    setError(null);
    try {
      const blob = await pdf(
        <MarkdownPdfDocument markdown={document} title={documentName} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${documentName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Preview
        </h2>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isGenerating}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isGenerating ? "Generating…" : "Download .pdf"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{document}</ReactMarkdown>
      </div>
    </div>
  );
}
