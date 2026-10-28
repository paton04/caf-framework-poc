-- v2 rearchitecture: expand caf_igps from 17 placeholder rows (one per
-- principle) to the real 42-outcome DGE-sector catalogue, and correct
-- the 17 existing rows' names — they were all seeded using the
-- *principle's* name rather than their own real outcome name (e.g.
-- B2.a was "Identity and access management", which is actually the
-- real name of B2.d; B2.a's real name is "Identity Verification,
-- Authentication and Authorisation"). Source: Ofgem's "NIS Supplementary
-- Guidance and CAF Overlay for DGE Sector" (TLP:WHITE, Feb 2024) —
-- see docs/v2-rearchitecture-design.md and the project memory entry
-- dated 2026-10-28 for the full research trail.
--
-- sort_order is now a single running sequence across the WHOLE table
-- (1-42), not reset to 1 at the start of each principle as the old
-- seed did. The app fetches caf_igps with one global `order by
-- sort_order` (no per-section query) and filters into sections
-- client-side — with only one outcome per principle, resetting
-- sort_order per principle happened to produce lots of duplicate
-- values (every principle's first/only outcome had sort_order 1), and
-- ties were broken by undefined scan order rather than anything
-- guaranteed. With multiple outcomes per principle that would now
-- produce genuinely wrong/unstable ordering, so this fixes it properly
-- rather than carrying the same fragility forward at a larger scale.
--
-- B6.c (present on SGN's own tracking sheet) and E1.a/E1.b's exact
-- wording are confirmed from the Overlay; B6.c itself doesn't appear in
-- either the core NCSC CAF or this Overlay and is still an open
-- question out with Simon/Agha — not included here, add as one more row
-- once confirmed.

insert into public.caf_igps (code, section_code, name, sort_order) values
  ('A1.a', 'A', 'Board Direction', 1),
  ('A1.b', 'A', 'Roles and Responsibilities', 2),
  ('A1.c', 'A', 'Decision Making', 3),
  ('A2.a', 'A', 'Risk Management Process', 4),
  ('A2.b', 'A', 'Assurance', 5),
  ('A3.a', 'A', 'Asset Management', 6),
  ('A4.a', 'A', 'Supply Chain', 7),

  ('B1.a', 'B', 'Policy and Process Development', 8),
  ('B1.b', 'B', 'Policy and Process Implementation', 9),
  ('B2.a', 'B', 'Identity Verification, Authentication and Authorisation', 10),
  ('B2.b', 'B', 'Device Management', 11),
  ('B2.c', 'B', 'Privileged User Management', 12),
  ('B2.d', 'B', 'Identity and Access Management (IdAM)', 13),
  ('B3.a', 'B', 'Understanding Data', 14),
  ('B3.b', 'B', 'Data in Transit', 15),
  ('B3.c', 'B', 'Stored Data', 16),
  ('B3.d', 'B', 'Mobile Data', 17),
  ('B3.e', 'B', 'Media / Equipment Sanitisation', 18),
  ('B4.a', 'B', 'Secure by Design', 19),
  ('B4.b', 'B', 'Secure Configuration', 20),
  ('B4.c', 'B', 'Secure Management', 21),
  ('B4.d', 'B', 'Vulnerability Management', 22),
  ('B5.a', 'B', 'Resilience Preparation', 23),
  ('B5.b', 'B', 'Design for Resilience', 24),
  ('B5.c', 'B', 'Backups', 25),
  ('B6.a', 'B', 'Cyber Security Culture', 26),
  ('B6.b', 'B', 'Cyber Security Training', 27),

  ('C1.a', 'C', 'Monitoring Coverage', 28),
  ('C1.b', 'C', 'Securing Logs', 29),
  ('C1.c', 'C', 'Generating Alerts', 30),
  ('C1.d', 'C', 'Identifying Security Incidents', 31),
  ('C1.e', 'C', 'Monitoring Tools and Skills', 32),
  ('C2.a', 'C', 'System Abnormalities for Attack Detection', 33),
  ('C2.b', 'C', 'Proactive Attack Discovery', 34),

  ('D1.a', 'D', 'Response Plan', 35),
  ('D1.b', 'D', 'Response and Recovery Capability', 36),
  ('D1.c', 'D', 'Testing and Exercising', 37),
  ('D2.a', 'D', 'Incident Root Cause Analysis', 38),
  ('D2.b', 'D', 'Using Incidents to Drive Improvements', 39),

  ('E1.a', 'E', 'Governance and risk management processes relating to physical security risks', 40),
  ('E1.b', 'E', 'Designing and implementing physical security controls', 41),
  ('E2.a', 'E', 'Broader resilience risks', 42)
on conflict (code) do update set
  name = excluded.name,
  section_code = excluded.section_code,
  sort_order = excluded.sort_order;
