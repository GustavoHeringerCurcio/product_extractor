import { z } from "zod";
import { getPrompts, savePrompts } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  titlePrompt: z.string(),
  descriptionPrompt: z.string(),
});

export async function GET() {
  const prompts = await getPrompts();
  return Response.json({
    titlePrompt: prompts.title,
    descriptionPrompt: prompts.description,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prompts = await savePrompts({
    title: parsed.data.titlePrompt,
    description: parsed.data.descriptionPrompt,
  });

  return Response.json({
    titlePrompt: prompts.title,
    descriptionPrompt: prompts.description,
  });
}
