export type ReferencePhoto = {
  original: string;
  thumbnail: string;
  source: string;
  title: string;
};

export async function searchReferencePhotos(
  query: string,
): Promise<ReferencePhoto[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    engine: "google_images",
    q: query,
    hl: "pt-BR",
    gl: "br",
    imgsz: "large",
    api_key: apiKey,
  });

  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      images_results?: Array<{
        original?: string;
        thumbnail?: string;
        source?: string;
        title?: string;
      }>;
    };

    return (data.images_results ?? [])
      .filter((item) => item.original)
      .slice(0, 12)
      .map((item) => ({
        original: item.original as string,
        thumbnail: item.thumbnail ?? (item.original as string),
        source: item.source ?? "",
        title: item.title ?? "",
      }));
  } catch {
    return [];
  }
}
