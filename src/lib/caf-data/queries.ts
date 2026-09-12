import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuditLogEntry,
  EvidenceFile,
  EvidenceLibraryRow,
  Igp,
  ProfileWithRole,
  ScopeItem,
  Section,
  SnapshotData,
  SnapshotDetail,
  SnapshotSummary,
  SupplierRow,
  UserRole,
} from "./types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EvidenceRow {
  id: string;
  igp_code: string;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
  uploaded_by: string | null;
  review_status: "pending" | "approved" | "rejected";
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expiry_date: string | null;
}

const EVIDENCE_COLUMNS =
  "id, igp_code, file_name, storage_path, uploaded_at, uploaded_by, review_status, review_note, reviewed_by, reviewed_at, expiry_date";

/** Emails for a set of user ids, keyed by id — skips ids that are null/absent. */
async function getEmailsByUserId(
  supabase: SupabaseClient,
  ids: (string | null)[]
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, email").in("id", uniqueIds);
  return new Map((data ?? []).map((p) => [p.id, p.email]));
}

function mapEvidenceRow(row: EvidenceRow, emailById: Map<string, string>): EvidenceFile {
  return {
    id: row.id,
    name: row.file_name,
    date: formatDate(row.uploaded_at),
    storagePath: row.storage_path,
    uploadedByEmail: row.uploaded_by ? (emailById.get(row.uploaded_by) ?? null) : null,
    reviewStatus: row.review_status,
    reviewNote: row.review_note,
    reviewedByEmail: row.reviewed_by ? (emailById.get(row.reviewed_by) ?? null) : null,
    reviewedAt: row.reviewed_at ? formatDate(row.reviewed_at) : null,
    expiryDate: row.expiry_date,
  };
}

function evidenceEmailIds(rows: EvidenceRow[]): string[] {
  return rows.flatMap((r) => [r.reviewed_by, r.uploaded_by]).filter((id): id is string => !!id);
}

/** The current user's role, or null if they don't have one assigned yet. */
export async function getCurrentUserRole(
  supabase: SupabaseClient,
  userId: string
): Promise<UserRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as UserRole | undefined) ?? null;
}

/** Full section -> IGP tree with live assessment state and evidence merged in. */
export async function getSections(supabase: SupabaseClient): Promise<Section[]> {
  const [sectionsRes, igpsRes, assessmentsRes, evidenceRes] = await Promise.all([
    supabase.from("caf_sections").select("code, name, sort_order").order("sort_order"),
    supabase
      .from("caf_igps")
      .select("code, section_code, name, sort_order, guidance, guidance_note")
      .order("sort_order"),
    supabase.from("igp_assessments").select("igp_code, status, narrative, owner, owner_id"),
    supabase
      .from("evidence_files")
      .select(EVIDENCE_COLUMNS)
      .order("uploaded_at", { ascending: false }),
  ]);

  const assessments = assessmentsRes.data ?? [];
  const assessmentByIgp = new Map(assessments.map((a) => [a.igp_code, a]));
  const ownerEmailById = await getEmailsByUserId(
    supabase,
    assessments.map((a) => a.owner_id)
  );

  const evidenceRows = (evidenceRes.data ?? []) as EvidenceRow[];
  const evidenceEmailById = await getEmailsByUserId(supabase, evidenceEmailIds(evidenceRows));
  const evidenceByIgp = new Map<string, EvidenceFile[]>();
  for (const row of evidenceRows) {
    const list = evidenceByIgp.get(row.igp_code) ?? [];
    list.push(mapEvidenceRow(row, evidenceEmailById));
    evidenceByIgp.set(row.igp_code, list);
  }

  return (sectionsRes.data ?? []).map((sec) => ({
    code: sec.code,
    name: sec.name,
    principles: (igpsRes.data ?? [])
      .filter((igp) => igp.section_code === sec.code)
      .map((igp): Igp => {
        const assessment = assessmentByIgp.get(igp.code);
        return {
          id: igp.code,
          name: igp.name,
          status: assessment?.status ?? "none",
          narrative: assessment?.narrative ?? "",
          owner: assessment?.owner ?? "Unassigned",
          ownerId: assessment?.owner_id ?? null,
          ownerEmail: assessment?.owner_id ? (ownerEmailById.get(assessment.owner_id) ?? null) : null,
          guidance: igp.guidance,
          guidanceNote: igp.guidance_note ?? undefined,
          evidence: evidenceByIgp.get(igp.code) ?? [],
        };
      }),
  }));
}

/** Just the IGPs a supplier is linked to, for their restricted view. */
export async function getSupplierIgps(
  supabase: SupabaseClient,
  userId: string
): Promise<Igp[]> {
  const { data: access } = await supabase
    .from("supplier_igp_access")
    .select("igp_code")
    .eq("user_id", userId);
  const igpCodes = (access ?? []).map((a) => a.igp_code);
  if (igpCodes.length === 0) return [];

  const [igpsRes, evidenceRes] = await Promise.all([
    supabase
      .from("caf_igps")
      .select("code, name, sort_order, guidance, guidance_note")
      .in("code", igpCodes)
      .order("sort_order"),
    supabase
      .from("evidence_files")
      .select(EVIDENCE_COLUMNS)
      .in("igp_code", igpCodes)
      .order("uploaded_at", { ascending: false }),
  ]);

  const evidenceRows = (evidenceRes.data ?? []) as EvidenceRow[];
  // Suppliers can't read a reviewer's or uploader's profile row (profiles
  // RLS only covers internal roles reading everyone, or a user reading
  // their own), so those resolve to null for anyone but themselves —
  // fine, they still get review_status/review_note either way.
  const evidenceEmailById = await getEmailsByUserId(supabase, evidenceEmailIds(evidenceRows));
  const evidenceByIgp = new Map<string, EvidenceFile[]>();
  for (const row of evidenceRows) {
    const list = evidenceByIgp.get(row.igp_code) ?? [];
    list.push(mapEvidenceRow(row, evidenceEmailById));
    evidenceByIgp.set(row.igp_code, list);
  }

  // Suppliers never see status/narrative/owner — igp_assessments is off
  // limits to them entirely (enforced by RLS, not just hidden in the UI).
  return (igpsRes.data ?? []).map((igp) => ({
    id: igp.code,
    name: igp.name,
    status: "none",
    narrative: "",
    owner: "",
    ownerId: null,
    ownerEmail: null,
    guidance: igp.guidance,
    guidanceNote: igp.guidance_note ?? undefined,
    evidence: evidenceByIgp.get(igp.code) ?? [],
  }));
}

export async function getScopeItems(supabase: SupabaseClient): Promise<ScopeItem[]> {
  const { data } = await supabase
    .from("scope_items")
    .select("id, name, type, description, essential_function, criticality, owner, owner_id")
    .order("created_at");

  const rows = data ?? [];
  const ownerEmailById = await getEmailsByUserId(
    supabase,
    rows.map((r) => r.owner_id)
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    essentialFunction: row.essential_function,
    criticality: row.criticality,
    owner: row.owner,
    ownerId: row.owner_id,
    ownerEmail: row.owner_id ? (ownerEmailById.get(row.owner_id) ?? null) : null,
  }));
}

export async function getEvidenceLibrary(
  supabase: SupabaseClient
): Promise<EvidenceLibraryRow[]> {
  const { data } = await supabase
    .from("evidence_files")
    .select(EVIDENCE_COLUMNS)
    .order("uploaded_at", { ascending: false });

  const rows = (data ?? []) as EvidenceRow[];
  const evidenceEmailById = await getEmailsByUserId(supabase, evidenceEmailIds(rows));

  return rows.map((row) => {
    const evidence = mapEvidenceRow(row, evidenceEmailById);
    return {
      id: evidence.id,
      file: evidence.name,
      linkedIgp: row.igp_code,
      uploaded: evidence.date,
      uploadedByEmail: evidence.uploadedByEmail,
      reviewStatus: evidence.reviewStatus,
      reviewNote: evidence.reviewNote,
      reviewedByEmail: evidence.reviewedByEmail,
      reviewedAt: evidence.reviewedAt,
      expiryDate: evidence.expiryDate,
    };
  });
}

/** Every user with the supplier role, and which IGPs they're linked to. */
export async function getSuppliers(supabase: SupabaseClient): Promise<SupplierRow[]> {
  const { data: supplierRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "supplier");
  const userIds = (supplierRoles ?? []).map((r) => r.user_id);
  if (userIds.length === 0) return [];

  const [profilesRes, accessRes] = await Promise.all([
    supabase.from("profiles").select("id, email").in("id", userIds),
    supabase.from("supplier_igp_access").select("user_id, igp_code").in("user_id", userIds),
  ]);

  const igpsByUser = new Map<string, string[]>();
  for (const row of accessRes.data ?? []) {
    const list = igpsByUser.get(row.user_id) ?? [];
    list.push(row.igp_code);
    igpsByUser.set(row.user_id, list);
  }

  return (profilesRes.data ?? []).map((p) => ({
    userId: p.id,
    email: p.email,
    igpCodes: igpsByUser.get(p.id) ?? [],
  }));
}

/** Every invited user and their current role, for the admin page. */
export async function getProfilesWithRoles(
  supabase: SupabaseClient
): Promise<ProfileWithRole[]> {
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("id, email").order("created_at"),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const roleByUser = new Map((rolesRes.data ?? []).map((r) => [r.user_id, r.role as UserRole]));

  return (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    role: roleByUser.get(p.id) ?? null,
  }));
}

/** Owner_admin/contributor accounts, for the "link to a registered user" owner dropdown. */
export async function getInternalUsers(
  supabase: SupabaseClient
): Promise<{ id: string; email: string }[]> {
  const profiles = await getProfilesWithRoles(supabase);
  return profiles
    .filter((p) => p.role === "owner_admin" || p.role === "contributor")
    .map((p) => ({ id: p.id, email: p.email }));
}

/**
 * IGPs and scope items owned by a specific registered user — the "My
 * items" routing view. Unlinked (free-text-only) owners never show up
 * here, by design; that's what makes linking worthwhile.
 */
export async function getMyItems(
  supabase: SupabaseClient,
  userId: string
): Promise<{ igps: { code: string; name: string; sectionCode: string; status: string }[]; scopeItems: ScopeItem[] }> {
  const [assessmentsRes, scopeRes] = await Promise.all([
    supabase
      .from("igp_assessments")
      .select("igp_code, status, caf_igps!inner(name, section_code)")
      .eq("owner_id", userId),
    getScopeItems(supabase),
  ]);

  const igps = (assessmentsRes.data ?? []).map((row) => {
    const igp = Array.isArray(row.caf_igps) ? row.caf_igps[0] : row.caf_igps;
    return {
      code: row.igp_code,
      name: igp?.name ?? row.igp_code,
      sectionCode: igp?.section_code ?? "",
      status: row.status,
    };
  });

  return {
    igps,
    scopeItems: scopeRes.filter((s) => s.ownerId === userId),
  };
}

export async function getAllIgpCodes(
  supabase: SupabaseClient
): Promise<{ code: string; name: string }[]> {
  const { data } = await supabase
    .from("caf_igps")
    .select("code, name, sort_order")
    .order("sort_order");
  return data ?? [];
}

/**
 * Most recent audit log entries, newest first. Owner_admin only — RLS
 * enforces that already, this just orders/shapes what comes back. Entries
 * are written exclusively by database triggers (see 0005_audit_log.sql);
 * nothing in the app writes here directly.
 */
export async function getAuditLog(
  supabase: SupabaseClient,
  limit = 100
): Promise<AuditLogEntry[]> {
  const { data } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const actorEmailById = await getEmailsByUserId(
    supabase,
    rows.map((r) => r.actor_id)
  );

  return rows.map((row) => ({
    id: row.id,
    actorEmail: row.actor_id ? (actorEmailById.get(row.actor_id) ?? null) : null,
    action: row.action,
    summary: row.summary,
    createdAt: formatDateTime(row.created_at),
  }));
}

/** Snapshot list for the history page — deliberately excludes the `data` blob. */
export async function getSnapshots(supabase: SupabaseClient): Promise<SnapshotSummary[]> {
  const { data } = await supabase
    .from("cycle_snapshots")
    .select("id, label, frozen_at, frozen_by")
    .order("frozen_at", { ascending: false });

  const rows = data ?? [];
  const emailById = await getEmailsByUserId(
    supabase,
    rows.map((r) => r.frozen_by)
  );

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    frozenAt: formatDateTime(row.frozen_at),
    frozenByEmail: row.frozen_by ? (emailById.get(row.frozen_by) ?? null) : null,
  }));
}

export async function getSnapshotDetail(
  supabase: SupabaseClient,
  id: string
): Promise<SnapshotDetail | null> {
  const { data: row } = await supabase
    .from("cycle_snapshots")
    .select("id, label, frozen_at, frozen_by, data")
    .eq("id", id)
    .maybeSingle();

  if (!row) return null;

  const emailById = await getEmailsByUserId(supabase, [row.frozen_by]);

  return {
    id: row.id,
    label: row.label,
    frozenAt: formatDateTime(row.frozen_at),
    frozenByEmail: row.frozen_by ? (emailById.get(row.frozen_by) ?? null) : null,
    data: row.data as SnapshotData,
  };
}
