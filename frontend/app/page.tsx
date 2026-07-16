import NdaEditor from "@/components/NdaEditor";
import { loadMutualNdaTemplates } from "@/lib/loadTemplates";

export default async function Home() {
  const templates = await loadMutualNdaTemplates();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 lg:min-h-0 lg:overflow-hidden">
      <header className="flex flex-col gap-2 lg:shrink-0">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Mutual NDA Creator
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Fill in the details below to generate a Common Paper Mutual
          Non-Disclosure Agreement. The preview updates as you type, and you
          can download the completed document as a PDF.
        </p>
      </header>
      <NdaEditor templates={templates} />
    </div>
  );
}
