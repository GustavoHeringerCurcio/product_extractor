import { searchReferencePhotos } from "@/lib/serpapi";
import { getSerpapiUsage, recordSerpapiUsage } from "@/lib/serpapiUsage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();

  if (!query) {
    return Response.json({ error: "Parâmetro 'q' é obrigatório." }, { status: 400 });
  }

  const usageBefore = await getSerpapiUsage();

  if (usageBefore.remaining <= 0) {
    return Response.json({ photos: [], usage: usageBefore });
  }

  const photos = await searchReferencePhotos(query);
  const usage = await recordSerpapiUsage();

  return Response.json({ photos, usage });
}
