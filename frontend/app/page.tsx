import AuthGate from "@/components/AuthGate";
import DocumentChat from "@/components/DocumentChat";
import { loadCatalog, selectableEntries } from "@/lib/loadCatalog";
import { loadGenericDocuments } from "@/lib/loadGenericTemplates";
import { loadMutualNdaTemplates } from "@/lib/loadTemplates";

export default async function Home() {
  const [mutualNdaTemplates, catalog, genericDocuments] = await Promise.all([
    loadMutualNdaTemplates(),
    loadCatalog(),
    loadGenericDocuments(),
  ]);
  const documentCount = selectableEntries(catalog).length;

  return (
    <AuthGate>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 lg:min-h-0 lg:overflow-hidden">
        <header className="flex flex-col gap-2 lg:shrink-0">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Legal Document Creator
          </h1>
          <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Chat with our assistant to figure out which of our {documentCount}{" "}
            supported Common Paper agreement types you need, then fill it in.
            The preview updates as you answer, and you can download the
            completed document as a PDF.
          </p>
        </header>
        <DocumentChat mutualNdaTemplates={mutualNdaTemplates} genericDocuments={genericDocuments} />
      </div>
    </AuthGate>
  );
}
