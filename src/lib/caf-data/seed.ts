// Seed / reference data for the CAF trial demo.
//
// This stands in for real Supabase tables until Epic 1's schema is wired up.
// The shapes here (Section -> Igp, plus the flat scope/evidence/supplier
// lists below) are deliberately close to what the real tables will look
// like, so swapping this file for Supabase queries later is a small change,
// not a rewrite.

export type IgpStatus = "achieved" | "partial" | "not" | "none";

export interface EvidenceFile {
  name: string;
  date: string; // display string, e.g. "14 Jan 2026"
}

export interface Igp {
  id: string; // e.g. "B2.a"
  name: string;
  status: IgpStatus;
  narrative: string;
  owner: string;
  evidence: EvidenceFile[];
}

export interface Section {
  code: string; // "A".."E"
  name: string;
  principles: Igp[];
}

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

export const sections: Section[] = [
  {
    code: "A",
    name: "Managing security risk",
    principles: [
      {
        id: "A1.a",
        name: "Governance",
        status: "achieved",
        narrative:
          "Security governance is owned by the IT Security Steering Group, chaired quarterly by the CISO. Roles and responsibilities for NIS compliance are documented and reviewed annually.",
        owner: "R. Coyle — Identity & Access",
        evidence: [{ name: "Security_governance_charter.pdf", date: "08 Jan 2026" }],
      },
      {
        id: "A2.a",
        name: "Risk management",
        status: "achieved",
        narrative:
          "Risk register maintained centrally and reviewed monthly by the risk owner. NIS-relevant risks are flagged and tracked to closure with assigned owners.",
        owner: "S. Patel — Risk & Compliance",
        evidence: [{ name: "Risk_register_extract_Q1.xlsx", date: "20 Jan 2026" }],
      },
      {
        id: "A3.a",
        name: "Asset management",
        status: "partial",
        narrative:
          "Asset inventory exists for corporate IT and is reconciled quarterly. OT asset inventory is in progress — SCADA and field devices not yet fully catalogued.",
        owner: "J. Adeyemi — OT Engineering",
        evidence: [{ name: "OT_asset_inventory.xlsx", date: "02 Feb 2026" }],
      },
      {
        id: "A4.a",
        name: "Supply chain",
        status: "not",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
      },
    ],
  },
  {
    code: "B",
    name: "Protecting against attack",
    principles: [
      {
        id: "B1.a",
        name: "Service protection policy",
        status: "achieved",
        narrative:
          "Service protection policy published and acknowledged by all engineering staff. Reviewed annually alongside the security governance charter.",
        owner: "R. Coyle — Identity & Access",
        evidence: [{ name: "Service_protection_policy_v2.pdf", date: "11 Jan 2026" }],
      },
      {
        id: "B2.a",
        name: "Identity and access management",
        status: "achieved",
        narrative:
          "MFA is enforced across all corporate and OT-adjacent identity providers. Policy reviewed quarterly by the identity team. See attached policy and configuration extract.",
        owner: "R. Coyle — Identity & Access",
        evidence: [
          { name: "MFA_policy_v3.pdf", date: "14 Jan 2026" },
          { name: "Identity_config_extract.pdf", date: "14 Jan 2026" },
        ],
      },
      {
        id: "B3.a",
        name: "Data security",
        status: "partial",
        narrative:
          "Encryption at rest confirmed for corporate systems. OT historian encryption pending upgrade scheduled for next maintenance window.",
        owner: "J. Adeyemi — OT Engineering",
        evidence: [{ name: "Data_encryption_audit.pdf", date: "03 Feb 2026" }],
      },
      {
        id: "B4.a",
        name: "System security",
        status: "partial",
        narrative:
          "Hardening baseline applied to corporate estate. OT systems patching cadence still under review with the vendor.",
        owner: "M. Osei — Third-party Assurance",
        evidence: [],
      },
      {
        id: "B5.a",
        name: "Resilient networks",
        status: "none",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
      },
      {
        id: "B6.a",
        name: "Staff awareness",
        status: "achieved",
        narrative:
          "Annual security awareness training completed by 98% of staff. Phishing simulation run quarterly with results reported to the steering group.",
        owner: "S. Patel — Risk & Compliance",
        evidence: [{ name: "Awareness_training_completion.xlsx", date: "22 Jan 2026" }],
      },
    ],
  },
  {
    code: "C",
    name: "Detecting security events",
    principles: [
      {
        id: "C1.a",
        name: "Security monitoring",
        status: "partial",
        narrative:
          "SIEM deployed across corporate estate with 24/7 alerting. OT network monitoring coverage still being extended to remaining sites.",
        owner: "J. Adeyemi — OT Engineering",
        evidence: [{ name: "SIEM_config_extract.pdf", date: "19 Feb 2026" }],
      },
      {
        id: "C2.a",
        name: "Proactive discovery",
        status: "none",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
      },
    ],
  },
  {
    code: "D",
    name: "Minimising impact",
    principles: [
      {
        id: "D1.a",
        name: "Response and recovery planning",
        status: "partial",
        narrative:
          "Incident response plan documented and tested via tabletop exercise in Q4. Business continuity plan due for its annual refresh.",
        owner: "S. Patel — Risk & Compliance",
        evidence: [],
      },
      {
        id: "D2.a",
        name: "Lessons learned",
        status: "none",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
      },
    ],
  },
  {
    code: "E",
    name: "Physical security",
    principles: [
      {
        id: "E1.a",
        name: "Site access control",
        status: "achieved",
        narrative:
          "Badge access control in place at all sites with visitor sign-in and escort policy. Access logs retained for 12 months.",
        owner: "R. Coyle — Identity & Access",
        evidence: [{ name: "Site_access_policy.pdf", date: "05 Jan 2026" }],
      },
      {
        id: "E2.a",
        name: "Perimeter and monitoring",
        status: "achieved",
        narrative:
          "CCTV and perimeter alarm coverage confirmed at all Tier 1 sites, monitored by the 24/7 control room.",
        owner: "J. Adeyemi — OT Engineering",
        evidence: [{ name: "Perimeter_monitoring_report.pdf", date: "27 Jan 2026" }],
      },
    ],
  },
];

// --- Scope register (Epic 2) ---

export type ScopeItemType = "Environment" | "Application" | "Other";

export interface ScopeItem {
  name: string;
  type: ScopeItemType;
  description: string;
  essentialFunction: string;
  criticality: "Tier 1" | "Tier 2" | "Tier 3";
  owner: string;
}

export const scopeItems: ScopeItem[] = [
  {
    name: "OT Network Monitoring Platform",
    type: "Environment",
    description: "Monitors OT network traffic for anomalies across gas distribution sites.",
    essentialFunction: "Gas flow control",
    criticality: "Tier 1",
    owner: "J. Adeyemi",
  },
  {
    name: "Field Engineering Scheduler",
    type: "Application",
    description: "Schedules and dispatches field engineers to maintenance jobs.",
    essentialFunction: "Maintenance dispatch",
    criticality: "Tier 2",
    owner: "S. Patel",
  },
  {
    name: "Corporate Identity Provider",
    type: "Environment",
    description: "Single sign-on and identity provider for all corporate and OT-adjacent systems.",
    essentialFunction: "Access control (all)",
    criticality: "Tier 1",
    owner: "R. Coyle",
  },
  {
    name: "SCADA Historian",
    type: "Environment",
    description: "Historical data store for SCADA telemetry across the distribution network.",
    essentialFunction: "Gas flow control",
    criticality: "Tier 1",
    owner: "J. Adeyemi",
  },
  {
    name: "Supplier Portal (pilot)",
    type: "Application",
    description: "Pilot portal allowing third-party suppliers to submit their own compliance evidence.",
    essentialFunction: "Third-party assurance",
    criticality: "Tier 3",
    owner: "M. Osei",
  },
];

// --- Evidence library (Epic 3) ---

export interface EvidenceLibraryRow {
  file: string;
  linkedIgp: string;
  uploaded: string;
  status: "Approved" | "Under review" | "Missing";
  expiry: string;
}

export const evidenceLibrary: EvidenceLibraryRow[] = [
  { file: "MFA_policy_v3.pdf", linkedIgp: "B2.a", uploaded: "14 Jan 2026", status: "Approved", expiry: "Jan 2027" },
  { file: "OT_asset_inventory.xlsx", linkedIgp: "A3.a", uploaded: "02 Feb 2026", status: "Approved", expiry: "Feb 2027" },
  { file: "SIEM_config_extract.pdf", linkedIgp: "C1.a", uploaded: "19 Feb 2026", status: "Under review", expiry: "—" },
  { file: "BC_DR_plan_2025.pdf", linkedIgp: "D2.a", uploaded: "—", status: "Missing", expiry: "—" },
];

// --- Suppliers (Epic 7 preview — RBAC not enforced yet) ---

export interface SupplierRow {
  name: string;
  essentialFunction: string;
  status: IgpStatus;
}

export const suppliers: SupplierRow[] = [
  { name: "Example Supplier Ltd", essentialFunction: "OT network monitoring", status: "achieved" },
  { name: "Example Vendor Co", essentialFunction: "Field engineer scheduling", status: "none" },
];
