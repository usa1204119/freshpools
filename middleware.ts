import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Role-based route guard.
 *   /me/*    → CANDIDATE
 *   /co/*    → COMPANY
 *   /admin/* → ADMIN
 * Wrong role redirects to that user's own dashboard rather than 403-ing, so a
 * mistyped URL is never a dead end.
 */

const GUARDS = [
  { prefix: "/me", role: "CANDIDATE" },
  { prefix: "/co", role: "COMPANY" },
  { prefix: "/admin", role: "ADMIN" },
] as const;

const DASHBOARD: Record<string, string> = {
  CANDIDATE: "/me",
  COMPANY: "/co",
  ADMIN: "/admin",
};

function matchGuard(pathname: string) {
  return GUARDS.find(
    (guard) => pathname === guard.prefix || pathname.startsWith(`${guard.prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const guard = matchGuard(pathname);
  if (!guard) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  const role = String(token.role ?? "CANDIDATE");
  if (role !== guard.role) {
    return NextResponse.redirect(new URL(DASHBOARD[role] ?? "/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/me/:path*", "/co/:path*", "/admin/:path*"],
};
