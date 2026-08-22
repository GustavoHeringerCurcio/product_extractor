import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  return NextResponse.redirect(new URL("/login", request.url));
}
