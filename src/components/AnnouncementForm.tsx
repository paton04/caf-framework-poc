"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAnnouncement } from "@/app/actions/settings";

export function AnnouncementForm({ current }: { current: string | null }) {
  const router = useRouter();
  const [text, setText] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateAnnouncement(text);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="field" style={{ maxWidth: 520 }}>
      {error && <div className="banner auth-error">{error}</div>}
      <textarea
        className="narrative-box"
        rows={2}
        placeholder="e.g. Ofgem submission due 15 July — please finish reviewing evidence by 10th."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button className="btn-primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </button>
        {current && (
          <button
            type="button"
            className="link-btn"
            disabled={isPending}
            onClick={() => {
              setText("");
              startTransition(async () => {
                try {
                  await updateAnnouncement("");
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Something went wrong.");
                }
              });
            }}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
