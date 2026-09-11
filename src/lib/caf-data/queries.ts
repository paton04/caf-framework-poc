import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EvidenceFile,
  EvidenceLibraryRow,
  Igp,
  ProfileWithRole,
  ScopeItem,
  Section,
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

interface EvidenceRow {
  id: string;
  igp_code: string;
  file_name: string;
  storage_path: string;
  uploaded_at: string;
  review_status: "pending" | "approved" | "rejected";
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expiry_date: string | null;
}

const EVIDENCE_COLUMNS =
  "id, igp_code, file_name, storage_path, uploaded_at, review_status, review_note, reviewed_by, reviewed_at, expiry_date";

/** Reviewer emails for whichever evidence rows actually have one, keyed by user id. */
async function getReviewerEmails(
  supabase: SupabaseClient,
  rows: EvidenceRow[]
): Promise<Map<string, string>> {
  const reviewerIds = [...new Set(rows.map((r) => r.reviewed_by).filter((id): id is string => !!id))];
  if (reviewerIds.length === 0) return new Map();

  const { data } = await supabase.from("profiles").select("id, email").in("id", reviewerIds);
  return new Map((data ?? []).map((p) => [p.id, p.email]));
}

function mapEvidenceRow(row: EvidenceRow, reviewerEmailById: Map<string, string>): EvidenceFile {
  return {
    id: row.id,
    name: row.file_name,
    date: formatDate(row.uploaded_at),
    storagePath: row.storage_path,
    reviewStatus: row.review_status,
    reviewNote: row.review_note,
    reviewedByEmail: row.reviewed_by ? (reviewerEmailById.get(row.reviewed_by) ?? null) : null,
    reviewedAt: row.reviewed_at ? formatDate(row.reviewed_at) : null,
    expiryDate: row.expiry_date,
  };
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
    supabase.from("igp_assessments").select("igp_code, status, narrative, owner"),
    supabase
      .from("evidence_files")
      .select(EVIDENCE_COLUMNS)
      .order("uploaded_at", { ascending: false }),
  ]);

  const assessmentByIgp = new Map(
    (assessmentsRes.data ?? []).map((a) => [a.igp_code, a])
  );
  const evidenceRows = (evidenceRes.data ?? []) as EvidenceRow[];
  const reviewerEmailById = await getReviewerEmails(supabase, evidenceRows);
  const evidenceByIgp = new Map<string, EvidenceFile[]>();
  for (const row of evidenceRows) {
    const list = evidenceByIgp.get(row.igp_code) ?? [];
    list.push(mapEvidenceRow(row, reviewerEmailById));
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
  // Suppliers can't read the reviewer's profile row (profiles RLS only
  // covers internal roles reading everyone, or a user reading their own),
  // so this comes back empty for them — reviewedByEmail ends up null,
  // which is fine, they still get review_status/review_note either way.
  const reviewerEmailById = await getReviewerEmails(supabase, evidenceRows);
  const evidenceByIgp = new Map<string, EvidenceFile[]>();
  for (const row of evidenceRows) {
    const list = evidenceByIgp.get(row.igp_code) ?? [];
    list.push(mapEvidenceRow(row, reviewerEmailById));
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
    guidance: igp.guidance,
    guidanceNote: igp.guidance_note ?? undefined,
    evidence: evidenceByIgp.get(igp.code) ?? [],
  }));
}

export async function getScopeItems(supabase: SupabaseClient): Promise<ScopeItem[]> {
  const { data } = await supabase
    .from("scope_items")
    .select("id, name, type, description, essential_function, criticality, owner")
    .order("created_at");

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    essentialFunction: row.essential_function,
    criticality: row.criticality,
    owner: row.owner,
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
  const reviewerEmailById = await getReviewerEmails(supabase, rows);

  return rows.map((row) => {
    const evidence = mapEvidenceRow(row, reviewerEmailById);
    return {
      id: evidence.id,
      file: evidence.name,
      linkedIgp: row.igp_code,
      uploaded: evidence.date,
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

export async function getAllIgpCodes(
  supabase: SupabaseClient
): Promise<{ code: string; name: string }[]> {
  const { data } = await supabase
    .from("caf_igps")
    .select("code, name, sort_order")
    .order("sort_order");
  return data ?? [];
}
