import { createHash, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "af_session";

const SALT = "anuncio-facil:v1";

export function authToken(password: string): string {
  return createHash("sha256").update(`${SALT}:${password}`).digest("hex");
}

export function expectedToken(): string {
  const password = process.env.APP_PASSWORD;
  if (!password) return "";
  return authToken(password);
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = expectedToken();
  if (!expected) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
