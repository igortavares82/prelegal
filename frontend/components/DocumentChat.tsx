"use client";

import { useState } from "react";
import type { GenericDocument } from "@/lib/loadGenericTemplates";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import type { NdaFormData } from "@/lib/types";
import GenericDocumentEditor from "./GenericDocumentEditor";
import NdaEditor from "./NdaEditor";
import ResolveChat from "./ResolveChat";

interface DocumentChatProps {
  mutualNdaTemplates: MutualNdaTemplates;
  genericDocuments: GenericDocument[];
  initialSlug?: string;
  initialData?: unknown;
}

/**
 * Top-level, document-type-agnostic entry point (PL-6): a resolver chat
 * figures out which catalog document the user wants, then hands off to
 * whichever pipeline matches — the Mutual NDA's dedicated one, or the
 * generic one shared by every other document type.
 *
 * `initialSlug`/`initialData` (PL-7) skip the resolver entirely and open
 * straight into the matching editor, pre-filled — used when reopening a
 * document from My Documents.
 */
export default function DocumentChat({
  mutualNdaTemplates,
  genericDocuments,
  initialSlug,
  initialData,
}: DocumentChatProps) {
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(initialSlug ?? null);

  if (resolvedSlug === "mutual-nda") {
    return (
      <NdaEditor
        templates={mutualNdaTemplates}
        initialData={initialData as NdaFormData | undefined}
      />
    );
  }

  if (resolvedSlug) {
    const document = genericDocuments.find((doc) => doc.slug === resolvedSlug);
    if (document) {
      return (
        <GenericDocumentEditor
          document={document}
          initialValues={initialData as Record<string, string> | undefined}
        />
      );
    }
  }

  return <ResolveChat onResolved={setResolvedSlug} />;
}
