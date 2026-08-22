import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

const PUBLIC_PAGES = ["/login"];
const PUBLIC_API = ["/api/login", "/api/logout"];

export function proxy(request: NextRequest) {
  if (!process.env.APP_PASSWORD) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isPublicPage = PUBLIC_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isPublicApi = PUBLIC_API.some((p) => pathname === p);

  if (isPublicPage || isPublicApi) {
    if (
      pathname === "/login" &&
      verifyToken(request.cookies.get(AUTH_COOKIE)?.value)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!verifyToken(request.cookies.get(AUTH_COOKIE)?.value)) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets so that both pages and
     * API routes are protected.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
