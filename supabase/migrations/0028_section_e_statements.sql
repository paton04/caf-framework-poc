-- v2 rearchitecture: statement text for all 3 Section E contributing
-- outcomes (Ofgem's own DGE-specific supplementary objective, not core
-- NCSC CAF — see the 2026-10-28 research notes on why E is official
-- despite not being an NCSC objective), same method as every other
-- section migration. Source: Ofgem's "NIS Supplementary Guidance and
-- CAF Overlay for DGE Sector" (TLP:WHITE, v3.0, Feb 2024), Annex C.
--
-- All three are Not achieved/Achieved only, no partially-achieved tier
-- — same situation as roughly half the outcomes across every section
-- so far. E2.a in particular is a single achieved statement — the
-- Overlay genuinely only sets one bar for this outcome.
--
-- This completes statement content for every section (A, B, C, D, E) —
-- 9 statements here bring the running total to 236 across all 42
-- contributing outcomes.

insert into public.caf_igp_statements (igp_code, statement_number, level, statement, sort_order) values

-- E1.a — Governance and risk management processes relating to physical security risks (0 partial, 5 achieved)
('E1.a', 1, 'achieved', 'The physical security of your network and information systems is delivered via appropriate organisational structures, well-defined responsibilities and accountabilities and suitably qualified and experienced personnel. These structures are designed to ensure that physical and cyber security policies and plans are mutually supporting/complimentary.', 1),
('E1.a', 2, 'achieved', 'Your management systems (cyber or physical or both) include security objectives relating to the physical security of your network and information systems.', 2),
('E1.a', 3, 'achieved', 'You have identified and registered all facilities, and specific zones within those facilities, that require physical security control measures for the purpose of securing network and information systems.', 3),
('E1.a', 4, 'achieved', 'Your physical security risk assessments take account of the potential impacts resulting from unauthorised physical access to network and information system components. Your investment in physical security measures reflects these potential impacts.', 4),
('E1.a', 5, 'achieved', 'Your organisation has made use of NPSA guidance to help inform its view of appropriate and proportionate physical security measures for its sites.', 5),

-- E1.b — Designing and implementing physical security controls (0 partial, 3 achieved)
('E1.b', 1, 'achieved', 'You reference relevant NPSA guidance when designing and implementing new physical security controls.', 1),
('E1.b', 2, 'achieved', 'You have identified any IT networked physical security systems that your cyber security management system relies on and have included these systems as part of your NIS scope.', 2),
('E1.b', 3, 'achieved', 'Projects to implement new IT networked physical security systems employ devices that are assured under the Cyber Assurance of Physical Security Systems (CAPSS) scheme, or recognised equivalent.', 3),

-- E2.a — Broader resilience risks (0 partial, 1 achieved)
('E2.a', 1, 'achieved', 'Your risks assessment take account of the risks to NIS system that are associated with accidents, failures and environmental factors. You are actively and effectively controlling all risks.', 1)

on conflict (igp_code, statement_number) do update set
  level = excluded.level,
  statement = excluded.statement,
  sort_order = excluded.sort_order;
