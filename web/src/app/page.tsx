import { Analyzer } from "@/components/Analyzer";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Novo anúncio</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Cole um print do AliExpress e receba 5 títulos, descrição e preço
          sugerido em segundos.
        </p>
      </header>
      <Analyzer />
    </div>
  );
}
