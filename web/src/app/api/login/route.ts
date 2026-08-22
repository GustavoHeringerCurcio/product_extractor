import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, authToken, expectedToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof body.password === "string"
      ? body.password
      : "";

  const provided = authToken(password);
  const expected = expectedToken();

  if (!expected || provided !== expected) {
    return Response.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, provided, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
