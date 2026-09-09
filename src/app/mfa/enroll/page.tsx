"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Mandatory TOTP enrollment — every account must complete this once. Reached
// either straight after /set-password (new invite) or via proxy.ts sending
// back anyone with a session but no verified MFA factor.
export default function MfaEnrollPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();

      if (factors?.totp?.some((f) => f.status === "verified")) {
        router.replace("/mfa/verify");
        return;
      }

      // Clean up any abandoned enrollment attempt — Supabase won't allow a
      // second unverified TOTP factor to be created alongside one already
      // sitting there unverified. (The typed `totp` array only ever contains
      // verified factors; unverified ones only show up in `all`.)
      const abandoned = (factors?.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status === "unverified"
      );
      for (const factor of abandoned) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });

      if (cancelled) return;

      if (enrollError) {
        setError(enrollError.message);
        setLoading(false);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setLoading(false);
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleVerify(e: FormEvent) {
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
      <form className="auth-card" onSubmit={handleVerify}>
        <div className="auth-brand">Assurance Register</div>
        <h1>Set up two-factor authentication</h1>
        <p className="page-sub">
          MFA is required on every account. Scan this QR code with an authenticator app (Google
          Authenticator, 1Password, Authy, etc.), then enter the 6-digit code it shows.
        </p>

        {error && <div className="banner auth-error">{error}</div>}

        {qrCode && (
          <div className="mfa-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="Scan with your authenticator app" width={180} height={180} />
          </div>
        )}
        {secret && (
          <p className="mfa-secret">
            Can&apos;t scan it? Enter this key manually: <span className="mono">{secret}</span>
          </p>
        )}

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

        <button className="btn-primary" type="submit" disabled={pending || !factorId}>
          {pending ? "Verifying…" : "Verify and continue"}
        </button>
      </form>
    </div>
  );
}
