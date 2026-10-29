# v2 rearchitecture — design

Branch: `v2-rearchitecture`. Code/schema/data as they stood before this
work is tagged `v1-pre-rearchitecture` on `main`.

Triggered by Simon Lambe (SGN) reviewing the heatmap concept against SGN's
own hand-built CAF tracking spreadsheet, and confirming four things need
to be reflected in the tool (session notes, 2026-10-28 — see
`[[project-caf-trial]]` memory for the full research trail):

1. Adopt BP/EP (Basic Profile / Enhanced Profile) terminology.
2. Build a sub-check layer under each IGP/outcome.
3. That layer needs its own evidence, comments, and reporting.
4. Reflect anything else the real NCSC/Ofgem guidance has that the app
   is missing.

Plus a new structural point: some outcomes are assessed **enterprise-wide**
rather than per scope item (e.g. a company-wide data handling policy),
and the tool needs to show that distinctly from per-scope-item evidence.

This document is the schema design for all of that. **Nothing in this
document has been built yet** — it's for review before any migration runs.

---

## 1. Terminology — one open naming decision up front

In real NCSC CAF terminology, a code like `B2.a` is a **Contributing
Outcome**; "IGP" (Indicator of Good Practice) properly refers to the
individual numbered statements *underneath* a Contributing Outcome (the
new sub-check layer this design adds). This app has used "IGP" to mean
the outcome code itself since Epic 1 — `caf_igps` table, `igp_code`
column, `Igp` TypeScript type, `IgpPanel` component, etc., are all named
on that basis.

Strictly correct naming would rename `caf_igps` → `caf_outcomes` and
`igp_code` → `outcome_code` throughout. **I'm not proposing that rename**
— it would touch every table, every RLS policy, every component, and
every query in a fully working app, for a naming-purity gain with no
functional benefit. Recommendation: keep `caf_igps`/`igp_code` as the
existing (slightly-misnamed) internal identifier, and give the *new*
statement-level table the correctly-named `caf_igp_statements` — the
part that's actually new gets the right name; nothing already working
gets touched. Flagging this because it's exactly the kind of naming
call you've asked to be consulted on — say if you'd rather bite the
rename bullet.

---

## 2. Full outcome catalogue — expand `caf_igps`

Today's seed has one placeholder outcome per principle (17 rows), each
named after its *principle*, not its real outcome name. The real
DGE-sector catalogue (NCSC CAF + Ofgem's own Objective E) has **42**
contributing outcomes. This is additive + corrective, same table:

- Insert the 25 missing outcome rows (B2.b–d, B3.b–e, B4.b–d, B5.b–c,
  B6.b, A1.b–c, A2.b, B1.b, C1.b–e, C2.b, D1.b–c, D2.b, E1.b — see the
  full list in the `[[project-caf-trial]]` memory entry dated
  2026-10-28).
- Correct the name on each of the 17 existing rows from "principle name"
  to "real outcome name" (e.g. `B2.a` from "Identity and access
  management" to "Identity Verification, Authentication and
  Authorisation").

New columns on `caf_igps`:

```sql
alter table public.caf_igps
  add column if not exists bp_required_level text
    check (bp_required_level in ('achieved', 'partially_achieved', 'not_applicable')),
  add column if not exists ep_required_level text
    check (ep_required_level in ('achieved', 'partially_achieved', 'not_applicable')),
  add column if not exists evidence_examples text not null default '';
```

- `bp_required_level` / `ep_required_level`: what Ofgem's Basic/Enhanced
  Profile expects for this outcome — this is what lets the app compute
  its own "BP Status: Met" / "EP Status: Met" rollup, the way SGN's
  sheet does. **Not populated yet** — the specific per-outcome targets
  live in a document referenced by Ofgem's Overlay ("DESNZ's Initial
  Target Attainment Levels of Expected Cyber Resilience by the DGE
  Subsectors") that I haven't located a public copy of. Columns ship
  nullable; populate once we have that doc or Simon/Agha confirm values
  directly.
- `evidence_examples`: the "evidence Ofgem would typically expect to
  see" text the Overlay publishes per outcome (e.g. for B3.a: a
  completed NIS Information Asset Register). Better, source-specific
  content than the generic NCSC v4.0 guidance currently in `guidance` —
  worth re-sourcing `guidance` itself from the Overlay too, as a content
  pass, separate from this structural migration.

---

## 3. The sub-check layer — new tables

### 3.1 `caf_igp_statements` — the actual numbered statements

```sql
create table public.caf_igp_statements (
  id uuid primary key default gen_random_uuid(),
  igp_code text not null references public.caf_igps (code) on delete cascade,
  statement_number int not null,
  level text not null check (level in ('partially_achieved', 'achieved')),
  statement text not null,
  sort_order int not null,
  unique (igp_code, statement_number)
);
```

Mirrors how the Ofgem Overlay actually publishes these: each outcome
lists numbered statements under "Partially achieved" and "Achieved"
headings, numbering continuing across both (confirmed by reading the
real B3.a entry — partially-achieved statements are 1–6, achieved
continues 7–15; achieved statements typically restate/build on the
partial ones rather than replace them). `level` records which heading a
statement sits under; `statement_number` is just the Overlay's own
numbering, kept for traceability back to the source document (so a
statement can be pointed to as "B3.a #9" the way SGN's sheet already
does). Not modelling "Not achieved" statements as rows — those are
written as negative conditions ("at least one of the following is
true") rather than positive checks, and aren't something a reviewer
ticks off the way partial/achieved statements are.

Count varies per outcome (SGN's sheet shows this — some IGP columns
grey out well before row 15). Content population (the actual statement
text for all 42 outcomes) is a separate pass from this structural
migration — propose starting with Section B, since that's what's
actively under discussion with Simon/Agha, then filling in the rest
incrementally.

### 3.2 `igp_statement_assessments` — the working status layer

This is the new equivalent of `igp_assessments`, one level more
granular, and the piece that makes enterprise-wide evidence possible.

```sql
create table public.igp_statement_assessments (
  id uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.caf_igp_statements (id) on delete cascade,
  scope_item_id uuid references public.scope_items (id) on delete cascade,
  status text not null default 'not_reviewed'
    check (status in ('not_reviewed', 'yes', 'no', 'no_pending', 'yes_future_phase', 'not_in_scope')),
  note text not null default '',
  reviewed_by uuid references auth.users (id),
  updated_at timestamptz not null default now()
);

-- scope_item_id = null means "enterprise-wide" (applies org-wide, not
-- tied to one scope item). Postgres treats NULLs as distinct in a
-- normal unique constraint, so "one row per statement per scope item"
-- needs two partial unique indexes rather than one composite constraint:
create unique index igp_statement_assessments_per_scope_item
  on public.igp_statement_assessments (statement_id, scope_item_id)
  where scope_item_id is not null;
create unique index igp_statement_assessments_enterprise_wide
  on public.igp_statement_assessments (statement_id)
  where scope_item_id is null;
```

**Status vocabulary adopts SGN's own terms directly** (per "yes to BP/EP
terminology and everything involved"):
- `yes` — SGN's YES (review complete, met)
- `no` — SGN's NO (review complete, not met)
- `no_pending` — SGN's NO-100 (review ongoing, document requested)
- `yes_future_phase` — SGN's YES-P2 (met in a later phase review)
- `not_in_scope` — SGN's "Not in Scope"
- `not_reviewed` — app-internal default for a statement nobody has
  looked at yet. SGN's key only defines the four states above; worth
  confirming with Simon whether their blank/ungreyed cells are an
  implicit fifth state or just mean "not got to yet" — doesn't block
  building this, just affects what the "blank" UI state should be
  called.

**Enterprise-wide resolution:** for a given scope item + statement, the
*effective* status is: that scope item's own row if one exists,
otherwise the enterprise-wide (`scope_item_id is null`) row, otherwise
`not_reviewed`. This directly implements the Overlay's own allowance
(§1.34–1.38) that an OES may run one security management system across
its whole NIS scope or split across several — a single enterprise-wide
answer can satisfy the same statement for every scope item that doesn't
override it with its own.

> **Superseded 2026-10-29** — see `0020_enterprise_scope_item.sql`.
> Live use surfaced two problems with the NULL-scope_item_id model: the
> per-statement checkbox toggle was confusing (Fiona: "supposed to apply
> to an entire indicator"), and nothing in the UI made "enterprise-wide"
> feel like a first-class thing you could go look at. Replaced with a
> real, protected scope item (`scope_items.is_enterprise`) — assessing
> an outcome *on* that scope item, through the exact same UI as any
> other, now *is* the organisation-wide default. Resolution logic is
> unchanged in spirit (own row wins, else the enterprise row, else
> not_reviewed) — it's just two real scope item ids being compared
> instead of a real one and NULL, which also meant 0018's RPC workaround
> for the old partial-unique-index pair could be dropped — a normal
> unique constraint and a plain upsert work now.

### 3.3 Rolling statement status up to the outcome-level status

`igp_assessments.status` (today: free-text, manually set) becomes
**derived** from its statements once an outcome has statements
populated, via a trigger — not a one-off computation, since it needs to
recompute whenever any underlying statement assessment changes:

- `achieved` if every `level = 'achieved'` statement resolves `yes` (or
  `yes_future_phase`/`not_in_scope` — treated as satisfied) for that
  scope item.
- `partial` if every `level = 'partially_achieved'` statement resolves
  satisfied, but not every achieved-level one does.
- `not` otherwise, once at least one statement has been reviewed.
- `none` if nothing under that outcome has been reviewed yet.

For outcomes that don't have statements populated yet (most of them,
initially), `igp_assessments.status` keeps working exactly as it does
today — manually set, no change in behaviour. This makes the rollout
incremental: populate statements for an outcome, and that outcome's
status starts being derived instead of manual; leave an outcome alone,
and it behaves exactly as now.

### 3.4 BP/EP met — computed, not stored

Once `bp_required_level`/`ep_required_level` are populated (§2) and
outcome statuses are being derived (§3.3), "BP Status: Met" / "EP
Status: Met" per scope item is a straightforward comparison — every
non-`not_applicable` outcome's derived status meets or exceeds its
required level for that profile. Proposed as a SQL view
(`scope_item_profile_status`) rather than a stored column, so it's
always live and never goes stale. Low effort once the inputs above
exist; not useful to build before they do.

---

## 4. Evidence and comments on statements (Simon's point 3)

**Evidence** — extend the existing `evidence_files` table rather than
building a parallel system, reusing all the existing review/RLS/storage
machinery:

```sql
alter table public.evidence_files
  add column if not exists statement_assessment_id uuid
    references public.igp_statement_assessments (id) on delete set null;
```

Evidence can then attach at three granularities: outcome-level (today,
`igp_code` set), the scope item as a whole (today, `description` set,
no `igp_code`), or one specific statement (new, `statement_assessment_id`
set). Same GRC review workflow, same storage bucket, same audit
triggers — just one more nullable foreign key, same pattern as the
`scope_item_id` column 0012 already added.

**Comments** — nothing like this exists yet (`review_note` is a single
field per evidence row, not a thread). New table:

```sql
create table public.statement_comments (
  id uuid primary key default gen_random_uuid(),
  statement_assessment_id uuid not null references public.igp_statement_assessments (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);
```

This is already a full conversation thread as it stands — nothing
limits a statement to one comment, it's an unbounded, ordered
(`created_at`) list, and `author_id` already identifies who said what.
What it doesn't have yet is **@mentions**:

```sql
create table public.statement_comment_mentions (
  comment_id uuid not null references public.statement_comments (id) on delete cascade,
  mentioned_user_id uuid not null references auth.users (id) on delete cascade,
  primary key (comment_id, mentioned_user_id)
);
```

**How mentions actually get resolved**: the composer UI drives an
`@`-triggered picker (like Jira/Slack) backed by the list of internal
users — `owner_admin`/`contributor`/`grc` can already all read every
profile (0003 + 0012's existing policies), so no new RLS is needed just
to populate the picker. When someone's picked, the UI inserts readable
text into the comment body (`@Jane Smith`) *and* records their user ID
alongside it; on submit, the app writes the body as plain text and the
picked IDs into `statement_comment_mentions`. This is the same
two-part pattern Jira/Slack/GitHub all use under the hood — the body
stays plain, readable text (degrades gracefully even without any
special rendering), the mention *relationship* is a separate structured
fact. Only internal-role users are mentionable, matching who can see
the thread at all — suppliers aren't part of this conversation space
yet, same as the rest of this layer.

**Notifications** — reuses the existing notification mechanism (the
`Notification` type, computed live, dismissible via
`notification_dismissals`) rather than inventing a second one: a new
notification row type ("X mentioned you on \<outcome\>") computed from
`statement_comment_mentions` where `mentioned_user_id = auth.uid()`,
same shape as every other notification already on login. This is
genuinely small given that infrastructure already exists.

**Edit/delete — deliberately not included, flagging it as a call to
confirm.** Jira/Slack/social platforms all let you edit or delete your
own comment; this design proposes append-only instead, matching
`audit_log`/`cycle_snapshots`'s philosophy elsewhere in this schema —
and arguably a *feature* here specifically, not a gap: in a compliance
tool, an evidence discussion nobody can quietly edit after the fact is
easier to defend to a regulator than one that can. If you want edit
support anyway, it's a small addition (an `edited_at` column + an
"author can update their own row" RLS policy) — just say so; I didn't
want to assume silently either way since it's a real behaviour choice,
not just a schema detail.

RLS: owner_admin/contributor/grc read+insert on both new tables;
suppliers excluded (statements aren't supplier-facing yet, matching
`igp_assessments` today).

**Reporting** — out of scope for this schema pass. Once statements,
evidence, and comments exist, the heatmap/scope-item views need a
drill-down UI (tile → outcome → its statement checklist) and the BP/EP
summary needs a place to live on the scope-item and org-wide views.
Proposing that as its own follow-up pass once this schema lands and has
real content in it to render.

---

## 5. RLS — same pattern as everything else already in the schema

- `caf_igp_statements`: reference data, same as `caf_igps` — any
  authenticated user can read.
- `igp_statement_assessments`, `statement_comments`: same split as
  `igp_assessments` — owner_admin/contributor read+write, GRC
  read-only (GRC reviews, doesn't do the work — matches 0012's existing
  model).
- `evidence_files`'s new column needs no new policy — the existing
  policies already govern the whole row.

---

## 6. What this migration is and isn't

**Additive, not destructive** — unlike 0012 (which dropped and
recreated `igp_assessments` because the keying genuinely changed), this
adds new tables and nullable columns. `igp_assessments`,
`evidence_files`, `scope_items` keep their current shape; nothing here
requires scrapping existing data. Proposed as `0015_igp_statements.sql`
onward, numbered same as every migration before it.

**Not included in this pass:**
- Statement text content for all 42 outcomes (content work, not schema
  — propose Section B first).
- `bp_required_level`/`ep_required_level` values (blocked on finding
  the DESNZ target-attainment document, or Simon/Agha confirming
  directly).
- Any UI changes (heatmap drill-down, statement checklist panel, BP/EP
  summary display, comment thread UI).
- The B6.c and B1.a/b questions currently out with Simon/Agha — the
  schema above doesn't depend on those answers; B6.c would just be one
  more `caf_igps` row to insert once it's confirmed what it is.

**Suggested order once this design is approved:** 1) run the structural
migration (tables, columns, empty) 2) expand/correct the 42-outcome
catalogue 3) populate Section B's statement text as a pilot 4) build
the statement-checklist UI against that one section 5) extend content
+ UI to the rest once the pattern's proven.

**Progress:** 1 and 2 are written (`0015_igp_statements.sql`,
`0016_igp_outcome_catalogue.sql`), not yet run against the live
database. 3 is also written (`0017_section_b_statements.sql`) — all 160
real statements for Section B's 20 outcomes, transcribed and verified
against the Ofgem Overlay PDF directly (see that migration's header
comment for the extraction/verification method — worth reading before
attempting to automate extraction of the other sections, since the
naive column-crop approach repeatedly produced scrambled text on this
document's layout). Steps 4-5 (UI) not started.
