import { PrintButton } from "@/components/PrintButton";

// A take-away reference, downloadable as a PDF (via the browser's own
// Print/Save-as-PDF, same mechanism as /report — no PDF-generation
// dependency needed) — for reading after a demo or handing to a new
// starter, distinct from the WelcomeGuide's short in-app walkthrough.
// Open to every signed-in role (no redirect/role gate) since every
// role has a section here.
export default function GuidePage() {
  return (
    <>
      <div className="page-header-row no-print">
        <div>
          <h1 className="page-title">User Guide</h1>
          <p className="page-sub">How to use the Assurance Register, role by role.</p>
        </div>
        <PrintButton />
      </div>

      <div className="print-only">
        <h1 className="page-title">User Guide</h1>
      </div>

      <div className="guide-content">
        <section>
          <h2>Overview</h2>
          <p>
            The Assurance Register tracks your organisation&apos;s self-assessment against the NCSC Cyber
            Assessment Framework (CAF), as interpreted by Ofgem&apos;s CAF Overlay for the Downstream Gas and
            Electricity (DGE) sector. It replaces a spreadsheet-based tracker with one place to record status,
            attach evidence, review it, and report on where you stand.
          </p>
          <p>There are four roles, each seeing a different slice of the tool:</p>
          <ul>
            <li>
              <strong>Owner/Admin</strong> — full access: scope register, assessment, user and account
              administration, required BP/EP levels, reference lists.
            </li>
            <li>
              <strong>Contributor</strong> — assesses scope items: answers outcomes, attaches evidence, leaves
              notes and comments.
            </li>
            <li>
              <strong>GRC</strong> — reviews evidence (approve/reject) and reads the board-facing Report. Doesn&apos;t
              do assessment work itself, for separation of duties.
            </li>
            <li>
              <strong>Supplier</strong> — sees only the specific outcomes they&apos;ve been asked to provide
              evidence for.
            </li>
          </ul>
        </section>

        <section>
          <h2>Scope items</h2>
          <p>
            A scope item is one system, application or service within your NIS scope — a SCADA historian, a
            billing platform, a network segment. Each one is assessed independently against all 42 CAF
            outcomes. Add one from the Scope items list (Owner/Admin and Contributor): give it a name, a type
            and essential function (both admin-configurable lists), a criticality tier, and an owner.
          </p>
          <h3>Enterprise-wide</h3>
          <p>
            Some outcomes apply to the whole organisation rather than one system — a company-wide access
            control policy, say, rather than something re-justified per asset. Ofgem&apos;s own guidance
            explicitly allows this: an operator may run its whole NIS scope under one management system rather
            than duplicating evidence per system. Assess that kind of outcome on the protected
            &quot;Enterprise-wide&quot; scope item instead of repeating it everywhere — every other scope item
            automatically inherits that outcome&apos;s status unless it&apos;s separately assessed on that
            specific item too, which always takes precedence.
          </p>
        </section>

        <section>
          <h2>Assessing an outcome</h2>
          <p>
            Open any outcome on a scope item to see its numbered sub-check statements — the same statements
            Ofgem&apos;s CAF Overlay sets out, split into what&apos;s needed to reach Partially achieved versus
            Achieved. Answer each one: <strong>Yes</strong>, <strong>No</strong>, <strong>In progress</strong>{" "}
            (under review, documentation requested), <strong>Later phase</strong> (will be met in a future
            review), or <strong>Not in scope</strong>. The outcome&apos;s overall status derives automatically
            from those answers — there&apos;s no separate manual status to set once sub-checks exist for an
            outcome.
          </p>
          <p>
            Each sub-check also has its own note, evidence attachment, and comment thread (with @mentions) —
            expand whichever you need under that sub-check, one at a time.
          </p>
        </section>

        <section>
          <h2>Evidence</h2>
          <p>
            Evidence attaches in two ways. Most evidence supports one specific sub-check, uploaded directly
            from that sub-check&apos;s own panel. General evidence — a network diagram, an asset register
            extract — describes a scope item as a whole rather than one indicator; add it from the scope
            item&apos;s own page, with a required description since it isn&apos;t tied to a specific question.
          </p>
          <p>
            Every file you&apos;ve ever uploaded is also browsable in one place via the Evidence nav link.
            Click any evidence file&apos;s name anywhere in the app to open it in a new tab (a signed,
            short-lived link — files are never public).
          </p>
        </section>

        <section>
          <h2>Evidence review (GRC)</h2>
          <p>
            Every evidence file starts <strong>Pending review</strong>. GRC reviews it from the Evidence
            screen: approve it, or reject it with a note explaining what&apos;s missing — the uploader can see
            that note and re-attach. Owner/Admin and Contributor can&apos;t review their own uploads; that&apos;s
            GRC&apos;s role specifically, for separation of duties.
          </p>
        </section>

        <section>
          <h2>Report</h2>
          <p>
            The Report page (Owner/Admin and GRC) is the board-facing summary: for every outcome, whether your
            organisation&apos;s current attainment meets the required level for <strong>BP (Basic Profile)</strong>{" "}
            and <strong>EP (Enhanced Profile)</strong> — Ofgem/DESNZ&apos;s two CAF attainment tiers for the DGE
            sector — rolled up across every scope item. Download it as a two-tab Excel workbook (Summary and
            Detail, the latter broken out per scope item), or use Print/Save as PDF for a point-in-time copy.
          </p>
        </section>

        <section>
          <h2>History</h2>
          <p>
            Freezing a cycle (Owner/Admin and Contributor) takes a permanent, read-only snapshot of the live
            assessment at that moment. Live data keeps being edited afterwards as normal — a snapshot is a
            frozen copy, not a lock. Past snapshots are browsable from History.
          </p>
        </section>

        <section>
          <h2>Admin</h2>
          <p>Owner/Admin only. From the Admin page:</p>
          <ul>
            <li>Invite accounts, set roles, disable/delete accounts, reset a password or MFA enrolment.</li>
            <li>Set which indicators a Supplier account can see.</li>
            <li>Manage the Type and Essential function options offered on scope items.</li>
            <li>
              Set the BP/EP required level per outcome — what&apos;s needed to count as meeting Basic or
              Enhanced Profile, which drives the Report&apos;s Met/Not met verdicts.
            </li>
            <li>Post an announcement banner shown to everyone signed in.</li>
            <li>Read the activity log — every significant action, automatically recorded and never editable.</li>
          </ul>
        </section>

        <section>
          <h2>Appearance</h2>
          <p>
            A light/dark mode toggle is in the top-right of every page — it defaults to your system preference
            until you choose one explicitly.
          </p>
        </section>

        <section>
          <h2>Getting help</h2>
          <p>
            The <strong>Guide</strong> button next to the theme toggle opens a short in-app walkthrough covering
            the same ground as this page, one step at a time.
          </p>
        </section>
      </div>
    </>
  );
}
