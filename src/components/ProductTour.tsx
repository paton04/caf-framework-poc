"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";
import type { UserRole } from "@/lib/caf-data/types";

// A real spotlight tour (react-joyride) that highlights live elements,
// not the old static-text modal — per Fiona's feedback that a "tour"
// should actually point at things. Confined to one page ("chapter") at
// a time rather than one continuous cross-page journey: the research
// behind this (Appcues/Atlassian's own spotlight guidance) says 3-5
// steps per tour and that copy must only reference what's visible right
// now, which a single real estate spanning several route changes can't
// guarantee — so each page gets its own short, self-contained tour
// instead, and the "Tour" button is context-aware (runs whichever
// chapter matches wherever you currently are).
//
// Targets use a dedicated data-tour-id attribute (not CSS classes,
// which shift with styling changes) — see each matching component.

interface Chapter {
  key: string;
  match: (pathname: string, role: UserRole | null) => boolean;
  steps: Step[];
}

const sel = (id: string) => `[data-tour-id="${id}"]`;

const CHAPTERS: Chapter[] = [
  {
    key: "scope-items",
    match: (pathname, role) => pathname === "/" && (role === "owner_admin" || role === "contributor"),
    steps: [
      {
        target: sel("overall-progress"),
        title: "Overall progress",
        content: "How far along your whole scope is, across every CAF outcome — at a glance.",
      },
      {
        target: sel("add-scope-item"),
        title: "Add a scope item",
        content:
          "A scope item is one system, application or service in your NIS scope — add one here to start assessing it.",
      },
      {
        target: sel("scope-items-list"),
        title: "Your scope items",
        content: "Select any item to open its own assessment — all 42 CAF outcomes, one at a time.",
      },
      {
        target: sel("enterprise-row"),
        title: "Organisation-wide defaults",
        content:
          "Some outcomes apply to the whole organisation rather than one system — assess those here instead of repeating them on every item.",
      },
    ],
  },
  {
    key: "outcome",
    match: (pathname) => pathname.includes("/scope/") && pathname.includes("/outcome/"),
    steps: [
      {
        target: sel("outcome-guidance"),
        title: "What good looks like",
        content: "Ofgem's own guidance on what counts as achieving this outcome.",
      },
      {
        target: sel("sub-checks"),
        title: "Sub-checks",
        content:
          "Answer each numbered sub-check — the outcome's overall status derives automatically from your answers.",
      },
      {
        target: sel("outcome-evidence"),
        title: "Outcome evidence",
        content: "Attach supporting files directly to this outcome.",
      },
    ],
  },
  {
    key: "evidence",
    match: (pathname) => pathname === "/evidence",
    steps: [
      {
        target: sel("evidence-table"),
        title: "Evidence library",
        content: "Every file uploaded across the organisation, in one place. Click a row to open and review it.",
      },
    ],
  },
  {
    key: "report",
    match: (pathname) => pathname === "/report",
    steps: [
      {
        target: sel("report-summary"),
        title: "Attainment summary",
        content:
          "How many outcomes meet the Basic and Enhanced Profile targets, rolled up across every scope item.",
      },
      {
        target: sel("report-download"),
        title: "Download or print",
        content:
          "Export a two-tab Excel workbook (Summary and per-scope-item Detail), or print/save as PDF for a point-in-time copy.",
      },
    ],
  },
  {
    key: "admin",
    match: (pathname) => pathname === "/admin",
    steps: [
      {
        target: sel("invite-user"),
        title: "Invite an account",
        content: "Invite a new user and set their role.",
      },
      {
        target: sel("user-table"),
        title: "Manage accounts",
        content: "Disable, delete, or reset a password/MFA enrolment on anyone's behalf.",
      },
      {
        target: sel("required-levels"),
        title: "BP/EP required levels",
        content: "Set what each outcome needs to reach to count as meeting Basic or Enhanced Profile.",
      },
    ],
  },
  {
    key: "supplier",
    match: (pathname, role) => pathname === "/" && role === "supplier",
    steps: [
      {
        target: sel("supplier-list"),
        title: "Your indicators",
        content:
          "The specific outcomes you've been asked to provide evidence for — attach files directly against each one.",
      },
    ],
  },
];

function chapterFor(pathname: string, role: UserRole | null): Chapter | null {
  return CHAPTERS.find((c) => c.match(pathname, role)) ?? null;
}

const SEEN_PREFIX = "caf-tour-seen-";

export function ProductTour({ role }: { role: UserRole | null }) {
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const chapter = chapterFor(pathname, role);

  // Auto-run a chapter the first time its page is visited (per
  // browser), same spirit as the old welcome modal, but scoped to
  // whichever page is actually in front of the user — not just the
  // very first page they ever land on.
  useEffect(() => {
    setRun(false);
    if (!chapter) return;
    try {
      if (!localStorage.getItem(SEEN_PREFIX + chapter.key)) setRun(true);
    } catch {
      // Private browsing etc. — just skip the auto-run.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function handleEvent(data: EventData) {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRun(false);
      if (!chapter) return;
      try {
        localStorage.setItem(SEEN_PREFIX + chapter.key, "1");
      } catch {
        // Won't be remembered next time, but closing still works now.
      }
    }
  }

  if (!chapter) return null;

  return (
    <>
      <button type="button" className="link-btn" onClick={() => setRun(true)}>
        Tour
      </button>
      <Joyride
        key={chapter.key}
        steps={chapter.steps}
        run={run}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        options={{
          buttons: ["close", "back", "skip", "primary"],
          // Clicking the X ends the tour outright, matching how every
          // other overlay in this app behaves on backdrop click — the
          // library's own default for this button just closes the
          // current tooltip and carries on to the next step instead.
          // Overlay-click/Escape don't have an equivalent "end the
          // whole tour" action (only 'close'/'next'/'replay'/false,
          // none of which reliably map to that), so they're disabled
          // rather than left on a default that could visibly dismiss
          // the tooltip while leaving the dimmed spotlight stuck up.
          closeButtonAction: "skip",
          overlayClickAction: false,
          dismissKeyAction: false,
          showProgress: true,
          skipBeacon: true,
          // primaryColor feeds internal hex math (a pulsing-beacon glow)
          // so it has to be a literal color, not a CSS var — matches
          // --solid-accent, which is frozen across themes anyway.
          primaryColor: "#2f6d6e",
          textColor: "var(--ink)",
          backgroundColor: "var(--panel)",
          arrowColor: "var(--panel)",
          overlayColor: "rgba(28, 43, 58, 0.5)",
          zIndex: 10000,
        }}
      />
    </>
  );
}
