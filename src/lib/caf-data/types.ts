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
}

export interface Section {
  code: string; // "A".."E"
  name: string;
  principles: Igp[];
}

export type ScopeItemType = "Environment" | "Application" | "Other";
export type ScopeCriticality = "Tier 1" | "Tier 2" | "Tier 3";

export const scopeItemTypes: ScopeItemType[] = ["Environment", "Application", "Other"];
export const scopeCriticalities: ScopeCriticality[] = ["Tier 1", "Tier 2", "Tier 3"];

export interface ScopeItem {
  id: string;
  name: string;
  type: ScopeItemType;
  description: string;
  essentialFunction: string;
  criticality: ScopeCriticality;
  owner: string;
  ownerId: string | null;
  ownerEmail: string | null;
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
  linkedIgp: string;
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
export interface ScopeItemAssessment {
  scopeItem: ScopeItem;
  sections: Section[];
}

export interface SupplierRow {
  userId: string;
  email: string;
  igpCodes: string[];
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
