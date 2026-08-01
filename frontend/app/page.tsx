import AuthGate from "@/components/AuthGate";
import Workspace from "@/components/Workspace";
import { loadCatalog, selectableEntries } from "@/lib/loadCatalog";
import { loadGenericDocuments } from "@/lib/loadGenericTemplates";
import { loadMutualNdaTemplates } from "@/lib/loadTemplates";

export default async function Home() {
  const [mutualNdaTemplates, catalog, genericDocuments] = await Promise.all([
    loadMutualNdaTemplates(),
    loadCatalog(),
    loadGenericDocuments(),
  ]);
  const selectable = selectableEntries(catalog);
  const documentNames = Object.fromEntries(
    selectable.map((entry) => [entry.slug, entry.name]),
  );

  return (
    <AuthGate>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 lg:min-h-0 lg:overflow-hidden">
        <Workspace
          mutualNdaTemplates={mutualNdaTemplates}
          genericDocuments={genericDocuments}
          documentNames={documentNames}
          documentCount={selectable.length}
        />
      </div>
    </AuthGate>
  );
}
