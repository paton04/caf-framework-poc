// Shared CAF domain types + display constants, used by both the server-side
// queries (queries.ts) and the components that render them. These used to
// live in seed.ts alongside demo data; now that every page reads from
// Supabase directly, seed.ts is gone and this is what's left.

export type IgpStatus = "achieved" | "partial" | "not" | "none";
export type UserRole = "owner_admin" | "contributor" | "supplier";

export const statusLabel: Record<IgpStatus, string> = {
  achieved: "Achieved",
  partial: "Partially achieved",
  not: "Not achieved",
  none: "Not started",
};

export const statusClass: Record<IgpStatus, string> = {
  achieved: "st-achieved",
  partial: "st-partial",
  not: "st-not",
  none: "st-none",
};

export const statusOrder: IgpStatus[] = ["none", "partial", "achieved", "not"];

export interface EvidenceFile {
  id: string;
  name: string;
  date: string; // display string, e.g. "14 Jan 2026"
  storagePath: string;
}

export interface Igp {
  id: string; // e.g. "B2.a"
  name: string;
  status: IgpStatus;
  narrative: string;
  owner: string;
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

export interface ScopeItem {
  name: string;
  type: ScopeItemType;
  description: string;
  essentialFunction: string;
  criticality: "Tier 1" | "Tier 2" | "Tier 3";
  owner: string;
}

export interface EvidenceLibraryRow {
  id: string;
  file: string;
  linkedIgp: string;
  uploaded: string;
}

export interface SupplierRow {
  userId: string;
  email: string;
  igpCodes: string[];
}

export interface ProfileWithRole {
  id: string;
  email: string;
  role: UserRole | null;
}
