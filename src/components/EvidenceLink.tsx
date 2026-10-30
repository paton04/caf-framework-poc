"use client";

import { useTransition } from "react";
import { getEvidenceUrl } from "@/app/actions/evidence";

// Turns an evidence filename into something you can actually open — a
// fresh signed URL is fetched on click rather than generated for every
// row up front (evidence lists can be long, and most files on a list
// never get opened). Opens a blank tab synchronously within the click
// handler and redirects it once the URL resolves, rather than calling
// window.open() after the await — doing it the other way round gets
// blocked as a popup by some browsers since it's no longer considered
// part of the original user gesture by then.
export function EvidenceLink({
  storagePath,
  children,
  className = "fname",
}: {
  storagePath: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const win = window.open("", "_blank");
    startTransition(async () => {
      try {
        const url = await getEvidenceUrl(storagePath);
        if (win) win.location.href = url;
        else window.open(url, "_blank", "noopener,noreferrer");
      } catch {
        win?.close();
        window.alert("Couldn't open this file — it may have been moved or deleted.");
      }
    });
  }

  return (
    <button
      type="button"
      className={className}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        font: "inherit",
        color: "var(--accent)",
        textDecoration: "underline",
        cursor: "pointer",
        textAlign: "left",
      }}
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "Opening…" : children}
    </button>
  );
}
