"use client";

import { useEffect, useState } from "react";
import type { UserRole } from "@/lib/caf-data/types";

interface Step {
  title: string;
  body: string;
}

const INTRO: Step = {
  title: "Welcome to the Assurance Register",
  body: "This tool tracks your organisation's self-assessment against the NCSC Cyber Assessment Framework, as interpreted by Ofgem's CAF Overlay for the DGE sector. Here's a quick tour of where everything lives.",
};

const INTERNAL_STEPS: Step[] = [
  {
    title: "Scope items",
    body: "The systems, applications and services in your NIS scope live here. Each one gets assessed against all 42 CAF outcomes — add a scope item to get started.",
  },
  {
    title: "Assess an outcome",
    body: "Open any outcome on a scope item to answer its numbered sub-checks one at a time, attach evidence, leave a note, and discuss it in comments. The outcome's overall status derives automatically from those answers.",
  },
  {
    title: "Enterprise-wide",
    body: "Some outcomes — a company-wide policy, say — apply to the whole organisation rather than one system. Assess those on the protected \"Enterprise-wide\" scope item instead of repeating them everywhere.",
  },
  {
    title: "Evidence",
    body: "Every file you upload lives in one library, each one traceable back to the outcome it supports and reviewable by GRC.",
  },
  {
    title: "History",
    body: "Freezing a cycle turns the live state into a permanent, read-only snapshot you can always come back to.",
  },
];

const GRC_STEPS: Step[] = [
  {
    title: "Evidence review",
    body: "Everything uploaded across the organisation comes through here — approve or reject each item, with a note explaining why.",
  },
  {
    title: "Report",
    body: "A board-ready summary of attainment against Basic and Enhanced Profile, rolled up across every scope item — downloadable as an Excel workbook, or printable.",
  },
];

const SUPPLIER_STEPS: Step[] = [
  {
    title: "Your indicators",
    body: "You'll only see the specific outcomes you've been asked to provide evidence for — attach files and leave notes directly against each one.",
  },
];

const ADMIN_EXTRA_STEPS: Step[] = [
  {
    title: "Report",
    body: "A board-ready summary of attainment against Basic and Enhanced Profile — downloadable as an Excel workbook, or printable.",
  },
  {
    title: "Admin",
    body: "Invite and manage accounts, set required BP/EP levels per outcome, and manage reference lists like scope item types — all from one place.",
  },
];

const NO_ROLE_STEP: Step = {
  title: "No role yet",
  body: "An Owner/Admin needs to assign you a role before you can get started — check back soon.",
};

function stepsForRole(role: UserRole | null): Step[] {
  if (role === "owner_admin") return [INTRO, ...INTERNAL_STEPS, ...ADMIN_EXTRA_STEPS];
  if (role === "contributor") return [INTRO, ...INTERNAL_STEPS];
  if (role === "grc") return [INTRO, ...GRC_STEPS];
  if (role === "supplier") return [INTRO, ...SUPPLIER_STEPS];
  return [INTRO, NO_ROLE_STEP];
}

const SEEN_KEY = "caf-welcome-seen";

// Trigger button lives here too (not just the overlay) so there's one
// mount point per page shell — TopNav already renders once per
// authenticated layout. Auto-opens once per browser on first visit
// (localStorage flag, not account-level — fine for an onboarding nudge,
// not state that needs to follow a user between devices); the same
// button re-opens it any time afterward, e.g. for a live demo.
export function WelcomeGuide({ role }: { role: UserRole | null }) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = stepsForRole(role);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch {
      // Private browsing etc. — just skip the auto-open.
    }
  }, []);

  function close() {
    setOpen(false);
    setStepIndex(0);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Won't be remembered next time, but closing still works now.
    }
  }

  function openManually() {
    setStepIndex(0);
    setOpen(true);
  }

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return (
    <>
      <button type="button" className="link-btn" onClick={openManually}>
        Guide
      </button>
      {open && <div className="overlay-backdrop" onClick={close} />}
      <div className={`overlay ${open ? "open" : ""}`} style={{ width: 520 }}>
        {open && (
          <>
            <div className="overlay-head">
              <button className="overlay-close" onClick={close} aria-label="Close guide">
                ✕
              </button>
              <div className="pid mono">
                STEP {stepIndex + 1} OF {steps.length}
              </div>
              <h3>{step.title}</h3>
            </div>
            <div className="overlay-body">
              <p>{step.body}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 20 }} aria-hidden="true">
                {steps.map((s, i) => (
                  <span
                    key={s.title}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: i === stepIndex ? "var(--solid-accent)" : "var(--rule-strong)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="overlay-foot" style={{ justifyContent: "space-between" }}>
              <button type="button" className="btn-secondary" onClick={close}>
                Skip
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {stepIndex > 0 && (
                  <button type="button" className="btn-secondary" onClick={() => setStepIndex((i) => i - 1)}>
                    Back
                  </button>
                )}
                {isLast ? (
                  <button type="button" className="btn-primary" onClick={close}>
                    Done
                  </button>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => setStepIndex((i) => i + 1)}>
                    Next
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
