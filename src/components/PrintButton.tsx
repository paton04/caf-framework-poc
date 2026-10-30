"use client";

// Printing needs window.print(), so this one small piece has to be a
// client component even though the report page itself is fully server-
// rendered. Relies on the .no-print rule in globals.css (hides the
// sidebar/topbar/this button itself) rather than any special PDF
// generation — the browser's own Print / Save as PDF does the rest.
export function PrintButton() {
  return (
    <button type="button" className="btn-primary no-print" onClick={() => window.print()}>
      Print / Save as PDF
    </button>
  );
}
