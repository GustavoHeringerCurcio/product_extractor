import { searchReferencePhotos } from "@/lib/serpapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (!query) {
    return Response.json({ error: "Parâmetro 'q' é obrigatório." }, { status: 400 });
  }

  const photos = await searchReferencePhotos(query);
  return Response.json({ photos });
}
