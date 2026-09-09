"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Landing point for Supabase's *default* invite/reset-password email links.
// Without custom SMTP, Supabase won't let us customise those templates to
// point at a server-side token_hash route (see src/app/auth/confirm), so
// they use GoTrue's own hosted /verify endpoint, which redirects here with
// the session as a URL fragment: #access_token=...&refresh_token=...
//
// Our browser client is pinned to the PKCE flow (see @supabase/ssr's
// createBrowserClient), so it won't auto-consume an implicit-flow fragment
// like this one — we read it ourselves and call setSession() directly,
// which has no flowType restriction.
//
// The fragment only exists in the browser, so this page must render the
// same "signing you in" state on the server and on first client paint —
// all the actual hash-reading happens client-side in the effect below, not
// during render, so server and client HTML always match on first paint.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const errorDescription = hash.get("error_description");
      if (errorDescription) {
        setError(errorDescription.replace(/\+/g, " "));
        return;
      }

      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (!access_token || !refresh_token) {
        setError("This link is missing its sign-in details. Ask for a new invite.");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      window.history.replaceState(null, "", window.location.pathname);
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      router.replace("/set-password");
      router.refresh();
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Assurance Register</div>
        {error ? (
          <>
            <h1>Link problem</h1>
            <div className="banner auth-error">{error}</div>
            <a className="btn-primary" style={{ display: "block", textAlign: "center" }} href="/login">
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <h1>Signing you in…</h1>
            <p className="page-sub">One moment.</p>
          </>
        )}
      </div>
    </div>
  );
}
