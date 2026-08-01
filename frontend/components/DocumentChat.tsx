"use client";

import { useState } from "react";
import type { GenericDocument } from "@/lib/loadGenericTemplates";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import GenericDocumentEditor from "./GenericDocumentEditor";
import NdaEditor from "./NdaEditor";
import ResolveChat from "./ResolveChat";

interface DocumentChatProps {
  mutualNdaTemplates: MutualNdaTemplates;
  genericDocuments: GenericDocument[];
}

/**
 * Top-level, document-type-agnostic entry point (PL-6): a resolver chat
 * figures out which catalog document the user wants, then hands off to
 * whichever pipeline matches — the Mutual NDA's dedicated one, or the
 * generic one shared by every other document type.
 */
export default function DocumentChat({ mutualNdaTemplates, genericDocuments }: DocumentChatProps) {
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);

  if (resolvedSlug === "mutual-nda") {
    return <NdaEditor templates={mutualNdaTemplates} />;
  }

  if (resolvedSlug) {
    const document = genericDocuments.find((doc) => doc.slug === resolvedSlug);
    if (document) {
      return <GenericDocumentEditor document={document} />;
    }
  }

  return <ResolveChat onResolved={setResolvedSlug} />;
}
