import { getPrompts, DEFAULT_TITLE_PROMPT, DEFAULT_DESCRIPTION_PROMPT } from "@/lib/settings";
import { PromptEditor } from "@/components/PromptEditor";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const prompts = await getPrompts();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Prompts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Edite os prompts usados para gerar o título e a descrição dos anúncios.
          As alterações são salvas no banco e aplicadas na próxima geração.
        </p>
      </header>
      <PromptEditor
        initialTitle={prompts.title}
        initialDescription={prompts.description}
        defaultTitle={DEFAULT_TITLE_PROMPT}
        defaultDescription={DEFAULT_DESCRIPTION_PROMPT}
      />
    </div>
  );
}
