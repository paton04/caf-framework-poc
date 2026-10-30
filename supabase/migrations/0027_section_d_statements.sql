-- v2 rearchitecture: statement text for all 5 Section D contributing
-- outcomes, same method as 0017/0025/0026 — see 0017's header for the
-- full sourcing/verification approach. Source: Ofgem's "NIS
-- Supplementary Guidance and CAF Overlay for DGE Sector" (TLP:WHITE,
-- v3.0, Feb 2024), Annex B.4.
--
-- Only D1.a has a partially-achieved tier — D1.b, D1.c, D2.a, and D2.b
-- are Not achieved/Achieved only, same situation as several Section A
-- and C outcomes. All five read cleanly in plain text, no column-
-- position cross-check needed.
--
-- 26 statements total (4 partial + 22 achieved) across the 5 outcomes.

insert into public.caf_igp_statements (igp_code, statement_number, level, statement, sort_order) values

-- D1.a — Response Plan (4 partial, 4 achieved)
('D1.a', 1, 'partially_achieved', 'Your response plan covers your essential functions.', 1),
('D1.a', 2, 'partially_achieved', 'Your response plan comprehensively covers scenarios that are focused on likely impacts of known and well-understood attacks only.', 2),
('D1.a', 3, 'partially_achieved', 'Your response plan is understood by all staff who are involved with your organisation''s response function.', 3),
('D1.a', 4, 'partially_achieved', 'Your response plan is documented and shared with all relevant stakeholders.', 4),
('D1.a', 5, 'achieved', 'Your incident response plan is based on a clear understanding of the security risks to the networks and information systems supporting your essential function.', 5),
('D1.a', 6, 'achieved', 'Your incident response plan is comprehensive (i.e., covers the complete lifecycle of an incident, roles and responsibilities, and reporting) and covers likely impacts of both known attack patterns and of possible attacks, previously unseen.', 6),
('D1.a', 7, 'achieved', 'Your incident response plan is documented and integrated with wider organisational business and supply chain response plans.', 7),
('D1.a', 8, 'achieved', 'Your incident response plan is communicated and understood by the business areas involved with the operation of your essential functions.', 8),

-- D1.b — Response and Recovery Capability (0 partial, 6 achieved)
('D1.b', 1, 'achieved', 'You understand the resources that will likely be needed to carry out any required response activities, and arrangements are in place to make these resources available.', 1),
('D1.b', 2, 'achieved', 'You understand the types of information that will likely be needed to inform response decisions and arrangements are in place to make this information available.', 2),
('D1.b', 3, 'achieved', 'Your response team members have the skills and knowledge required to decide on the response actions necessary to limit harm, and the authority to carry them out.', 3),
('D1.b', 4, 'achieved', 'Key roles are duplicated, and operational delivery knowledge is shared with all individuals involved in the operations and recovery of the essential function.', 4),
('D1.b', 5, 'achieved', 'Back-up mechanisms are available that can be readily activated to allow continued operation of your essential function (although possibly at a reduced level) if primary networks and information systems fail or are unavailable.', 5),
('D1.b', 6, 'achieved', 'Arrangements exist to augment your organisation''s incident response capabilities with external support if necessary (e.g. specialist cyber incident responders).', 6),

-- D1.c — Testing and Exercising (0 partial, 4 achieved)
('D1.c', 1, 'achieved', 'Exercise scenarios are based on incidents experienced by your and other organisations or are composed using experience or threat intelligence.', 1),
('D1.c', 2, 'achieved', 'Exercise scenarios are documented, regularly reviewed, and validated.', 2),
('D1.c', 3, 'achieved', 'Exercises are routinely run, with the findings documented and used to refine incident response plans and protective security, in line with the lessons learned.', 3),
('D1.c', 4, 'achieved', 'Exercises test all parts of your response cycle relating to your essential functions (e.g. restoration of normal function levels).', 4),

-- D2.a — Incident Root Cause Analysis (0 partial, 3 achieved)
('D2.a', 1, 'achieved', 'Root cause analysis is conducted routinely as a key part of your lessons learned activities following an incident.', 1),
('D2.a', 2, 'achieved', 'Your root cause analysis is comprehensive, covering organisational process issues, as well as vulnerabilities in your networks, systems, or software.', 2),
('D2.a', 3, 'achieved', 'All relevant incident data is made available to the analysis team to perform root cause analysis.', 3),

-- D2.b — Using Incidents to Drive Improvements (0 partial, 5 achieved)
('D2.b', 1, 'achieved', 'You have a documented incident review process / policy which ensures that lessons learned from each incident are identified, captured, and acted upon.', 1),
('D2.b', 2, 'achieved', 'Lessons learned cover issues with reporting, roles, governance, skills, and organisational processes as well as technical aspects of networks and information systems.', 2),
('D2.b', 3, 'achieved', 'You use lessons learned to improve security measures, including updating and retesting response plans when necessary.', 3),
('D2.b', 4, 'achieved', 'Security improvements identified as a result of lessons learned are prioritised, with the highest priority improvements completed quickly.', 4),
('D2.b', 5, 'achieved', 'Analysis is fed to senior management and incorporated into risk management and continuous improvement.', 5)

on conflict (igp_code, statement_number) do update set
  level = excluded.level,
  statement = excluded.statement,
  sort_order = excluded.sort_order;
