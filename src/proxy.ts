import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanism, new
// name/export) — see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
//
// Runs on every request: refreshes the Supabase session cookie, then gates
// access. Accounts are invite-only and MFA is mandatory on every one, so the
// gate has three levels: no session -> /login; session but no MFA factor
// enrolled yet -> /mfa/enroll; a factor exists but this session hasn't
// completed the aal2 challenge -> /mfa/verify.

const PUBLIC_PATHS = ["/login", "/auth/confirm", "/auth/callback"];
const AUTH_FLOW_PATHS = ["/set-password", "/mfa/enroll", "/mfa/verify"];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user, aal } = await updateSession(request);

  if (matches(pathname, PUBLIC_PATHS)) {
    return supabaseResponse;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (matches(pathname, AUTH_FLOW_PATHS)) {
    return supabaseResponse;
  }

  // aal.nextLevel is 'aal1' only when the user has no MFA factor at all.
  if (aal?.nextLevel === "aal1") {
    return NextResponse.redirect(new URL("/mfa/enroll", request.url));
  }
  // A verified factor exists but this session hasn't completed the aal2
  // challenge yet (e.g. a fresh password-only sign-in).
  if (aal && aal.currentLevel !== aal.nextLevel) {
    return NextResponse.redirect(new URL("/mfa/verify", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
