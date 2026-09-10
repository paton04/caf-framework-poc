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
  // Condensed "what good looks like" guidance, distilled from NCSC's CAF
  // v4.0 "Achieved" indicators of good practice for this principle:
  // https://www.ncsc.gov.uk/collection/cyber-assessment-framework
  // guidanceNote flags the handful of items that don't map cleanly onto the
  // current official framework (a renamed principle, or a section this
  // trial added that isn't part of CAF at all) — see IgpPanel.
  guidance: string;
  guidanceNote?: string;
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
        guidance:
          "Security governance is owned and directed at board level, with a named individual holding overall accountability. The board receives regular, accurate reporting and understands how security supports the essential function. Roles and responsibilities are clearly defined and understood at every level, and risk decisions are made by people with the right skills, authority and visibility of the organisation's risk appetite.",
      },
      {
        id: "A2.a",
        name: "Risk management",
        status: "achieved",
        narrative:
          "Risk register maintained centrally and reviewed monthly by the risk owner. NIS-relevant risks are flagged and tracked to closure with assigned owners.",
        owner: "S. Patel — Risk & Compliance",
        evidence: [{ name: "Risk_register_extract_Q1.xlsx", date: "20 Jan 2026" }],
        guidance:
          "Risk to network and information systems is assessed and managed systematically, informed by a clear, current understanding of the relevant threat actors and their likely methods. Risk management processes evolve as the technical estate, threats and business context change, and are reviewed regularly for effectiveness. Assurance methods (testing, audits) give confidence that protective measures actually work, with gaps remediated promptly.",
      },
      {
        id: "A3.a",
        name: "Asset management",
        status: "partial",
        narrative:
          "Asset inventory exists for corporate IT and is reconciled quarterly. OT asset inventory is in progress — SCADA and field devices not yet fully catalogued.",
        owner: "J. Adeyemi — OT Engineering",
        evidence: [{ name: "OT_asset_inventory.xlsx", date: "02 Feb 2026" }],
        guidance:
          "A complete, current inventory exists of everything needed to deliver the essential function — including IT, OT and supporting infrastructure — with dependencies between assets understood and documented. Assets are prioritised by criticality, ownership is clearly assigned, and security is considered from creation through to decommissioning.",
      },
      {
        id: "A4.a",
        name: "Supply chain",
        status: "not",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
        guidance:
          "The organisation understands its full supply chain, including sub-contractors, and factors supplier ownership, location and security posture into procurement decisions. Contracts clearly define security responsibilities, and critical suppliers are held to security standards appropriate to the threats faced. Software supply chains are managed with visibility of components, secure development practices, and verification of release integrity.",
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
        guidance:
          "Security policies, processes and procedures are documented, communicated and enforced consistently, reflecting real working practices rather than being purely theoretical. They are reviewed regularly — including in response to incidents and changes — and cyber security is embedded across other organisational policies (e.g. HR, physical access), with leadership visibility of how well they're followed.",
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
        guidance:
          "Access to systems supporting the essential function is granted only after high-confidence identity verification, with multi-factor authentication required for all users, including remote access. Privileged actions are carried out from dedicated, tightly controlled devices, access rights are reviewed at least every six months, and third-party access is time-limited. All access is logged, correlated and regularly audited, with unauthorised attempts investigated promptly.",
      },
      {
        id: "B3.a",
        name: "Data security",
        status: "partial",
        narrative:
          "Encryption at rest confirmed for corporate systems. OT historian encryption pending upgrade scheduled for next maintenance window.",
        owner: "J. Adeyemi — OT Engineering",
        evidence: [{ name: "Data_encryption_audit.pdf", date: "03 Feb 2026" }],
        guidance:
          "Critical data is inventoried, and its handling — including who can access it — is understood and kept current. Data in transit and at rest is protected with encryption and access controls proportionate to its sensitivity, backups are tested and held securely (including offline copies), and mobile devices are managed centrally with the ability to remotely wipe them. Devices and media are properly sanitised before reuse or disposal.",
      },
      {
        id: "B4.a",
        name: "System security",
        status: "partial",
        narrative:
          "Hardening baseline applied to corporate estate. OT systems patching cadence still under review with the vendor.",
        owner: "M. Osei — Third-party Assurance",
        evidence: [],
        guidance:
          "Systems are segmented into security zones with simple, well-understood data flows, and designed to recover gracefully rather than fail outright. Configuration is baselined and changes are controlled, administration is restricted to trusted users on dedicated devices, and vulnerabilities are tracked and patched promptly across the full technology stack. Software and hardware are kept on actively supported versions wherever possible.",
      },
      {
        id: "B5.a",
        name: "Resilient networks",
        status: "none",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
        guidance:
          "Business continuity and disaster recovery plans are tested through multiple methods — failover tests, tabletop exercises and, where appropriate, red-teaming — and threat intelligence feeds into ongoing resilience decisions. Critical networks are segregated from general business and external systems, single points of failure and resource constraints are identified and mitigated, and backups plus redundant systems or providers are in place for critical functions.",
      },
      {
        id: "B6.a",
        name: "Staff awareness",
        status: "achieved",
        narrative:
          "Annual security awareness training completed by 98% of staff. Phishing simulation run quarterly with results reported to the steering group.",
        owner: "S. Patel — Risk & Compliance",
        evidence: [{ name: "Awareness_training_completion.xlsx", date: "22 Jan 2026" }],
        guidance:
          "Leadership visibly prioritises security and staff understand their own role in protecting the essential function. Reporting security concerns is encouraged and treated positively, with no blame culture discouraging disclosure. Training is tailored, tracked and refreshed regularly across all levels of the organisation, and its effectiveness is evaluated rather than just attendance being recorded.",
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
        guidance:
          "Monitoring coverage is designed around a clear understanding of the systems in scope and how attackers are likely to behave, combining host- and network-based detection. Logs are collected from all relevant sources, time-synchronised, and reviewed in near real time, with alerts enriched automatically and triage procedures documented and tested. Analysts understand normal behaviour well enough to reliably spot the abnormal, and threat intelligence keeps detection relevant.",
      },
      {
        id: "C2.a",
        name: "Proactive discovery",
        status: "none",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
        guidance:
          "Resources are allocated for regular, risk-based hunting for threats that evade automated controls, using a documented, repeatable methodology focused on attacker behaviour rather than isolated indicators. Successful hunts are converted into new automated detections, findings are recorded and analysed to improve the wider security posture, and the hunting process itself is reviewed and improved over time.",
        guidanceNote:
          'NCSC renamed this principle "Threat Hunting" in CAF v4.0 — shown here under its original name to match the rest of this trial.',
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
        guidance:
          "Incident response plans are grounded in a realistic assessment of risk, covering both known attack patterns and novel scenarios, and are integrated with wider business continuity and supply chain planning. Roles, resourcing and authority to act are clear, and the organisation can maintain reduced-capacity operation if needed. Plans are tested regularly through exercises based on real incidents and threat intelligence, covering the full incident lifecycle including recovery, with findings used to improve them.",
      },
      {
        id: "D2.a",
        name: "Lessons learned",
        status: "none",
        narrative: "",
        owner: "Unassigned",
        evidence: [],
        guidance:
          "Every incident — and near-miss — triggers a structured review covering organisational, technical, human and threat-related factors, not just a technical post-mortem. Findings are used to improve reporting, governance, skills, policy and technical controls, with material issues escalated to senior leadership and fed into risk management. The organisation also learns from sector-wide and national incidents, not only its own.",
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
        guidance:
          "Physical access to sites and facilities supporting the essential function is restricted to authorised individuals, verified at the point of entry. Visitors are signed in, escorted where appropriate, and access logs are retained for a defined period to support investigation if needed.",
        guidanceNote:
          "Physical security isn't a formal CAF objective — NCSC's framework covers Objectives A–D only. This section reflects general good practice, not an official CAF indicator.",
      },
      {
        id: "E2.a",
        name: "Perimeter and monitoring",
        status: "achieved",
        narrative:
          "CCTV and perimeter alarm coverage confirmed at all Tier 1 sites, monitored by the 24/7 control room.",
        owner: "J. Adeyemi — OT Engineering",
        evidence: [{ name: "Perimeter_monitoring_report.pdf", date: "27 Jan 2026" }],
        guidance:
          "Site perimeters are protected by physical controls (fencing, barriers, alarms) appropriate to the sensitivity of what's inside, with continuous monitoring — e.g. CCTV — covering the most critical sites. Alerts from perimeter systems are routed to a monitored response capability, not just recorded for later review.",
        guidanceNote:
          "Physical security isn't a formal CAF objective — NCSC's framework covers Objectives A–D only. This section reflects general good practice, not an official CAF indicator.",
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
