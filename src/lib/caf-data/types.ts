// Shared CAF domain types + display constants, used by both the server-side
// queries (queries.ts) and the components that render them. These used to
// live in seed.ts alongside demo data; now that every page reads from
// Supabase directly, seed.ts is gone and this is what's left.

export type IgpStatus = "achieved" | "partial" | "not" | "none" | "not_applicable";
export type UserRole = "owner_admin" | "contributor" | "supplier" | "grc";

export const statusLabel: Record<IgpStatus, string> = {
  achieved: "Achieved",
  partial: "Partially achieved",
  not: "Not achieved",
  none: "Not started",
  not_applicable: "Not applicable",
};

export const statusClass: Record<IgpStatus, string> = {
  achieved: "st-achieved",
  partial: "st-partial",
  not: "st-not",
  none: "st-none",
  // Reuses "not started"'s grey — visually similar is fine, the label
  // text is what actually distinguishes "N/A" from "not started".
  not_applicable: "st-none",
};

export const statusOrder: IgpStatus[] = ["none", "partial", "achieved", "not", "not_applicable"];

export type ReviewStatus = "pending" | "approved" | "rejected";

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

// Reuses the IGP status colour classes — same visual language (green/
// grey/red), different label set, no need for a parallel set of classes.
export const reviewStatusClass: Record<ReviewStatus, string> = {
  pending: "st-none",
  approved: "st-achieved",
  rejected: "st-not",
};

export interface EvidenceFile {
  id: string;
  name: string;
  date: string; // display string, e.g. "14 Jan 2026"
  storagePath: string;
  uploadedByEmail: string | null;
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
  reviewedByEmail: string | null;
  reviewedAt: string | null; // display string
  expiryDate: string | null; // display string
  // Set (and required) for general scope-item evidence, which has no
  // indicator name to identify it by. Empty/absent for indicator evidence.
  description: string | null;
}

// The real numbered IGP statements under an outcome (v2 rearchitecture
// — see docs/v2-rearchitecture-design.md). Most outcomes don't have
// these populated yet (only Section B does so far); `statements` is an
// empty array everywhere else, and the outcome's own status stays
// manually set until statements exist for it.
export type StatementLevel = "partially_achieved" | "achieved";
export type StatementStatus = "not_reviewed" | "yes" | "no" | "no_pending" | "yes_future_phase" | "not_in_scope";

export const statementStatusLabel: Record<StatementStatus, string> = {
  not_reviewed: "Not reviewed",
  yes: "YES",
  no: "NO",
  no_pending: "NO-100 — review ongoing",
  yes_future_phase: "YES-P2 — later phase",
  not_in_scope: "Not in scope",
};

// Reuses the outcome-level status colours — same visual language, no
// need for a parallel palette just because the label set differs.
export const statementStatusClass: Record<StatementStatus, string> = {
  not_reviewed: "st-none",
  yes: "st-achieved",
  no: "st-not",
  no_pending: "st-partial",
  yes_future_phase: "st-partial",
  not_in_scope: "st-none",
};

// For the status-opt button variant (IgpPanel's existing `.status-opt
// .sel-X` classes only exist for achieved/partial/not/none/not_applicable)
// — maps the 6 statement states onto that same 4-colour set rather than
// adding a parallel palette just for statements.
export const statementStatusSelClass: Record<StatementStatus, string> = {
  not_reviewed: "none",
  yes: "achieved",
  no: "not",
  no_pending: "partial",
  yes_future_phase: "partial",
  not_in_scope: "none",
};

export const statementStatusOrder: StatementStatus[] = [
  "not_reviewed",
  "yes",
  "no",
  "no_pending",
  "yes_future_phase",
  "not_in_scope",
];

export interface StatementComment {
  id: string;
  authorEmail: string | null;
  body: string;
  createdAt: string; // display date + time
  mentionedEmails: string[];
}

export interface IgpStatement {
  id: string; // caf_igp_statements.id
  statementNumber: number;
  level: StatementLevel;
  text: string;
  // The *effective* status/note for this scope item: its own answer if
  // one exists, otherwise the Enterprise-wide scope item's answer,
  // otherwise not_reviewed. isEnterpriseWide is true when it came from
  // the latter — i.e. this scope item hasn't set its own answer and is
  // inheriting the organisation-wide default. There's no toggle to set
  // this directly any more (see 0020) — to set the default itself,
  // assess this statement on the Enterprise-wide scope item.
  status: StatementStatus;
  note: string;
  isEnterpriseWide: boolean;
  reviewedByEmail: string | null;
  updatedAt: string | null; // display date + time
  evidence: EvidenceFile[];
  comments: StatementComment[];
}

export interface Igp {
  id: string; // e.g. "B2.a"
  name: string;
  status: IgpStatus;
  narrative: string;
  owner: string;
  ownerId: string | null;
  ownerEmail: string | null;
  guidance: string;
  guidanceNote?: string;
  evidence: EvidenceFile[];
  statements: IgpStatement[];
}

export interface Section {
  code: string; // "A".."E"
  name: string;
  principles: Igp[];
}

// Was a fixed union; now an admin-managed list (configurable_lists,
// list_name 'scope_item_type' — see 0024_configurable_lists.sql), so
// it's just a string a scope item happens to hold, not a closed set
// TypeScript can check membership of.
export type ScopeItemType = string;
export type ScopeCriticality = "Tier 1" | "Tier 2" | "Tier 3";

export const scopeCriticalities: ScopeCriticality[] = ["Tier 1", "Tier 2", "Tier 3"];

// One entry in an admin-managed reference list (configurable_lists).
// `removed` is a soft-delete flag, never an actual row delete — a
// scope item already holding a removed value keeps it verbatim; the
// UI just stops offering it for new selections and marks it
// "(removed)" wherever it's still shown.
export interface ConfigurableListItem {
  value: string;
  removed: boolean;
}

export interface ScopeItem {
  id: string;
  name: string;
  type: ScopeItemType;
  // True if `type` no longer appears (or appears removed) in the
  // current scope_item_type list — computed server-side at fetch time
  // so display components don't each need the whole list just to know
  // this.
  typeRemoved: boolean;
  description: string;
  essentialFunction: string;
  essentialFunctionRemoved: boolean;
  criticality: ScopeCriticality;
  owner: string;
  ownerId: string | null;
  ownerEmail: string | null;
  // True for exactly one scope item — the organisation-wide default
  // (see 0020_enterprise_scope_item.sql). Assessing a statement here
  // is what IgpStatement.isEnterpriseWide elsewhere reflects as
  // "inherited" on every other scope item that hasn't overridden it.
  isEnterprise: boolean;
}

// Per-scope-item indicator counts for the scope items list — how far
// along that item's assessment is, without fetching its full set of
// sections/indicators/evidence just to count statuses.
export interface ScopeItemProgress {
  achieved: number;
  partial: number;
  not: number;
  none: number;
  notApplicable: number;
}

export interface EvidenceLibraryRow {
  id: string;
  file: string;
  storagePath: string;
  // Null for general scope-item evidence (not tied to one indicator).
  linkedIgp: string | null;
  description: string | null;
  scopeItemName: string | null;
  uploaded: string;
  uploadedByEmail: string | null;
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
  reviewedByEmail: string | null;
  reviewedAt: string | null;
  expiryDate: string | null;
}

// One scope item's full CAF assessment — the unit of work in the
// drill-down view (Overview -> a scope item -> its own heatmap).
// generalEvidence is evidence about the scope item as a whole (e.g. a
// network diagram) rather than any one indicator specifically.
export interface ScopeItemAssessment {
  scopeItem: ScopeItem;
  sections: Section[];
  generalEvidence: EvidenceFile[];
}

export interface SupplierRow {
  userId: string;
  email: string;
  igpCodes: string[];
}

// A personal, role-relevant call to action shown on login — computed live
// from current data each time. `count` is what it was dismissed at (see
// notification_dismissals): if the underlying count changes, it reappears
// even if previously acknowledged.
export interface Notification {
  id: string;
  message: string;
  href: string;
  count: number;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string | null;
  action: string;
  summary: string;
  createdAt: string; // display date + time
}

export interface ProfileWithRole {
  id: string;
  email: string;
  role: UserRole | null;
}

// Auth-level status (ban state, MFA enrollment) — only obtainable via
// the Supabase Admin API (service_role), unlike everything else in
// ProfileWithRole which comes from ordinary RLS-governed tables. Kept
// as a separate, optional lookup rather than folded into
// ProfileWithRole so every other page that fetches profiles doesn't
// start needing admin access it never did before.
export interface AdminUserStatus {
  id: string;
  banned: boolean;
  mfaEnrolled: boolean;
  lastSignInAt: string | null; // display string
}

// What a frozen snapshot's `data` column holds — the same shapes the
// live pages already render, so viewing a snapshot can reuse them.
// One assessment tree per scope item, since status is scope-item-specific.
export interface SnapshotData {
  scopeItems: ScopeItem[];
  assessments: ScopeItemAssessment[];
}

export interface SnapshotSummary {
  id: string;
  label: string;
  frozenAt: string; // display date + time
  frozenByEmail: string | null;
}

export interface SnapshotDetail extends SnapshotSummary {
  data: SnapshotData;
}

// Cross-scope-item rollup per outcome, for the board-facing progress
// report (/report) — "how many scope items are Achieved/Partial/Not
// achieved/Not started for B2.a", not one scope item's own status.
// Deliberately excludes the Enterprise-wide scope item (it's a policy
// bucket, not a system — counting it alongside real scope items would
// misrepresent "how many of our systems are compliant").
export interface ProgressReportOutcome {
  code: string;
  name: string;
  achieved: number;
  partial: number;
  not: number;
  none: number;
  notApplicable: number;
}

export interface ProgressReportSection {
  code: string;
  name: string;
  outcomes: ProgressReportOutcome[];
}

export interface ProgressReport {
  totalScopeItems: number;
  generatedAt: string; // display date + time
  sections: ProgressReportSection[];
}
