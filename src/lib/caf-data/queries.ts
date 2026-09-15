import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuditLogEntry,
  EvidenceFile,
  EvidenceLibraryRow,
  Igp,
  Notification,
  ProfileWithRole,
  ScopeItem,
  ScopeItemAssessment,
  ScopeItemProgress,
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
  scope_item_id: string | null;
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
  "id, igp_code, scope_item_id, file_name, storage_path, uploaded_at, uploaded_by, review_status, review_note, reviewed_by, reviewed_at, expiry_date";

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

/** Scope item names for a set of ids, keyed by id — skips null/absent ids. */
async function getScopeItemNamesById(
  supabase: SupabaseClient,
  ids: (string | null)[]
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return new Map();

  const { data } = await supabase.from("scope_items").select("id, name").in("id", uniqueIds);
  return new Map((data ?? []).map((s) => [s.id, s.name]));
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

/**
 * One scope item's full CAF assessment — every section/indicator, with
 * that item's own status/narrative/owner and evidence. This is the unit
 * of work per Zuber's restructure: B2.a can be Achieved for one scope
 * item and Not applicable for another, so assessment is keyed by
 * (scope_item, igp), not by igp alone.
 */
export async function getScopeItemAssessment(
  supabase: SupabaseClient,
  scopeItemId: string
): Promise<ScopeItemAssessment | null> {
  const [scopeItemRes, sectionsRes, igpsRes, assessmentsRes, evidenceRes] = await Promise.all([
    supabase
      .from("scope_items")
      .select("id, name, type, description, essential_function, criticality, owner, owner_id")
      .eq("id", scopeItemId)
      .maybeSingle(),
    supabase.from("caf_sections").select("code, name, sort_order").order("sort_order"),
    supabase
      .from("caf_igps")
      .select("code, section_code, name, sort_order, guidance, guidance_note")
      .order("sort_order"),
    supabase
      .from("igp_assessments")
      .select("igp_code, status, narrative, owner, owner_id")
      .eq("scope_item_id", scopeItemId),
    supabase
      .from("evidence_files")
      .select(EVIDENCE_COLUMNS)
      .eq("scope_item_id", scopeItemId)
      .order("uploaded_at", { ascending: false }),
  ]);

  if (!scopeItemRes.data) return null;

  const assessments = assessmentsRes.data ?? [];
  const assessmentByIgp = new Map(assessments.map((a) => [a.igp_code, a]));
  const ownerEmailById = await getEmailsByUserId(
    supabase,
    [...assessments.map((a) => a.owner_id), scopeItemRes.data.owner_id]
  );

  const evidenceRows = (evidenceRes.data ?? []) as EvidenceRow[];
  const evidenceEmailById = await getEmailsByUserId(supabase, evidenceEmailIds(evidenceRows));
  const evidenceByIgp = new Map<string, EvidenceFile[]>();
  for (const row of evidenceRows) {
    const list = evidenceByIgp.get(row.igp_code) ?? [];
    list.push(mapEvidenceRow(row, evidenceEmailById));
    evidenceByIgp.set(row.igp_code, list);
  }

  const sections: Section[] = (sectionsRes.data ?? []).map((sec) => ({
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

  const sir = scopeItemRes.data;
  const scopeItem: ScopeItem = {
    id: sir.id,
    name: sir.name,
    type: sir.type,
    description: sir.description,
    essentialFunction: sir.essential_function,
    criticality: sir.criticality,
    owner: sir.owner,
    ownerId: sir.owner_id,
    ownerEmail: sir.owner_id ? (ownerEmailById.get(sir.owner_id) ?? null) : null,
  };

  return { scopeItem, sections };
}

/** Every scope item's full assessment — used only for freezing a snapshot. */
export async function getAllScopeItemAssessments(
  supabase: SupabaseClient
): Promise<ScopeItemAssessment[]> {
  const scopeItems = await getScopeItems(supabase);
  const assessments = await Promise.all(
    scopeItems.map((s) => getScopeItemAssessment(supabase, s.id))
  );
  return assessments.filter((a): a is ScopeItemAssessment => a !== null);
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

/**
 * Achieved/partial/not/not-started/not-applicable counts per scope item,
 * for the quick-glance summary on the scope items list — two queries
 * total rather than a full getScopeItemAssessment per item. An indicator
 * with no igp_assessments row (or an explicit 'none' row) both count as
 * "not started", same as the default in getScopeItemAssessment.
 */
export async function getScopeItemProgress(
  supabase: SupabaseClient,
  scopeItemIds: string[]
): Promise<Map<string, ScopeItemProgress>> {
  const progressByScopeItem = new Map<string, ScopeItemProgress>(
    scopeItemIds.map((id) => [id, { achieved: 0, partial: 0, not: 0, none: 0, notApplicable: 0 }])
  );
  if (scopeItemIds.length === 0) return progressByScopeItem;

  const [{ count: totalIgps }, { data: rows }] = await Promise.all([
    supabase.from("caf_igps").select("code", { count: "exact", head: true }),
    supabase.from("igp_assessments").select("scope_item_id, status").in("scope_item_id", scopeItemIds),
  ]);

  for (const row of rows ?? []) {
    const entry = progressByScopeItem.get(row.scope_item_id);
    if (!entry) continue;
    if (row.status === "achieved") entry.achieved++;
    else if (row.status === "partial") entry.partial++;
    else if (row.status === "not") entry.not++;
    else if (row.status === "not_applicable") entry.notApplicable++;
  }

  for (const entry of progressByScopeItem.values()) {
    entry.none = (totalIgps ?? 0) - entry.achieved - entry.partial - entry.not - entry.notApplicable;
  }

  return progressByScopeItem;
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
  const scopeItemNameById = await getScopeItemNamesById(
    supabase,
    rows.map((r) => r.scope_item_id)
  );

  return rows.map((row) => {
    const evidence = mapEvidenceRow(row, evidenceEmailById);
    return {
      id: evidence.id,
      file: evidence.name,
      linkedIgp: row.igp_code,
      scopeItemName: row.scope_item_id ? (scopeItemNameById.get(row.scope_item_id) ?? null) : null,
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
): Promise<{
  igps: {
    scopeItemId: string;
    scopeItemName: string;
    code: string;
    name: string;
    sectionCode: string;
    status: string;
  }[];
  scopeItems: ScopeItem[];
}> {
  const [assessmentsRes, scopeRes] = await Promise.all([
    supabase
      .from("igp_assessments")
      .select("igp_code, scope_item_id, status, caf_igps!inner(name, section_code)")
      .eq("owner_id", userId),
    getScopeItems(supabase),
  ]);

  const scopeItemById = new Map(scopeRes.map((s) => [s.id, s.name]));

  const igps = (assessmentsRes.data ?? []).map((row) => {
    const igp = Array.isArray(row.caf_igps) ? row.caf_igps[0] : row.caf_igps;
    return {
      scopeItemId: row.scope_item_id,
      scopeItemName: scopeItemById.get(row.scope_item_id) ?? "Unknown scope item",
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

/**
 * Personal, role-relevant notifications for the signed-in user — surfaced
 * on login, no email infra involved. Computed live from current data each
 * time, then a dismissal is suppressed only while its count hasn't moved
 * since (see notification_dismissals) — dismissing can't permanently hide
 * a compliance gap that's still open.
 */
export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole
): Promise<Notification[]> {
  const notifications: Notification[] = [];

  if (role === "grc") {
    const { count } = await supabase
      .from("evidence_files")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "pending");
    if (count) {
      notifications.push({
        id: "pending-review",
        message: `${count} evidence item${count === 1 ? "" : "s"} awaiting your review`,
        href: "/evidence",
        count,
      });
    }
    return filterDismissed(supabase, userId, notifications);
  }

  const { count: rejectedCount } = await supabase
    .from("evidence_files")
    .select("id", { count: "exact", head: true })
    .eq("uploaded_by", userId)
    .eq("review_status", "rejected");
  if (rejectedCount) {
    notifications.push({
      id: "rejected-evidence",
      message: `${rejectedCount} of your evidence submission${rejectedCount === 1 ? "" : "s"} ${
        rejectedCount === 1 ? "was" : "were"
      } rejected`,
      // Suppliers have no Evidence Library page — their own submissions
      // and review status already show on their own indicators list.
      href: role === "supplier" ? "/" : "/evidence",
      count: rejectedCount,
    });
  }

  if (role === "owner_admin" || role === "contributor") {
    const { data: owned } = await supabase
      .from("igp_assessments")
      .select("scope_item_id, igp_code")
      .eq("owner_id", userId)
      .neq("status", "not_applicable");

    if (owned && owned.length > 0) {
      const scopeItemIds = [...new Set(owned.map((o) => o.scope_item_id))];
      const { data: evidenceRows } = await supabase
        .from("evidence_files")
        .select("scope_item_id, igp_code")
        .in("scope_item_id", scopeItemIds);

      const withEvidence = new Set(
        (evidenceRows ?? []).map((e) => `${e.scope_item_id}:${e.igp_code}`)
      );
      const missingCount = owned.filter(
        (o) => !withEvidence.has(`${o.scope_item_id}:${o.igp_code}`)
      ).length;

      if (missingCount > 0) {
        notifications.push({
          id: "missing-evidence",
          message: `${missingCount} of your item${missingCount === 1 ? "" : "s"} ${
            missingCount === 1 ? "has" : "have"
          } no evidence yet`,
          href: "/my-items",
          count: missingCount,
        });
      }
    }
  }

  return filterDismissed(supabase, userId, notifications);
}

/** Drops any notification whose count matches what the user already
 * dismissed it at — a changed count means it's a new instance of the
 * same issue, so it reappears. */
async function filterDismissed(
  supabase: SupabaseClient,
  userId: string,
  notifications: Notification[]
): Promise<Notification[]> {
  if (notifications.length === 0) return notifications;

  const { data: dismissals } = await supabase
    .from("notification_dismissals")
    .select("notification_id, dismissed_count")
    .eq("user_id", userId);

  const dismissedCountById = new Map(
    (dismissals ?? []).map((d) => [d.notification_id, d.dismissed_count])
  );

  return notifications.filter((n) => dismissedCountById.get(n.id) !== n.count);
}

/** The current announcement text, or null if none is set. Readable by any
 * signed-in user — an announcement is meant to be broadly visible. */
export async function getAnnouncement(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from("app_settings")
    .select("announcement")
    .eq("id", "singleton")
    .maybeSingle();
  return data?.announcement || null;
}
