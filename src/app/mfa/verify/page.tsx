"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Reached when a session has a verified TOTP factor but hasn't completed the
// aal2 challenge yet (e.g. every fresh password sign-in).
export default function MfaVerifyPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();

      if (listError) {
        setError(listError.message);
        setLoading(false);
        return;
      }

      const verified = factors?.totp?.find((f) => f.status === "verified");
      if (!verified) {
        router.replace("/mfa/enroll");
        return;
      }

      setFactorId(verified.id);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setPending(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (verifyError) {
      setError(verifyError.message);
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">Loading…</div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">Assurance Register</div>
        <h1>Enter your authentication code</h1>
        <p className="page-sub">Open your authenticator app and enter the current 6-digit code.</p>

        {error && <div className="banner auth-error">{error}</div>}

        <div className="field">
          <label htmlFor="code">6-digit code</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? "Verifying…" : "Verify"}
        </button>
      </form>
    </div>
  );
}
