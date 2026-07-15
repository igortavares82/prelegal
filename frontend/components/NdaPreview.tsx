"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NdaPreviewProps {
  document: string;
}

export default function NdaPreview({ document }: NdaPreviewProps) {
  function handleDownload() {
    const blob = new Blob([document], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "Mutual-NDA.md";
    link.click();
    URL.revokeObjectURL(url);
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
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Download .md
        </button>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{document}</ReactMarkdown>
      </div>
    </div>
  );
}
