-- Add "what good looks like" guidance to each CAF principle.
--
-- guidance is a condensed version of NCSC's CAF v4.0 "Achieved" indicators
-- of good practice for that principle (https://www.ncsc.gov.uk/collection/
-- cyber-assessment-framework). guidance_note flags the handful of items
-- that don't map cleanly onto the current official framework — a renamed
-- principle, or a section this trial added that isn't part of CAF at all.
--
-- Content here matches src/lib/caf-data/seed.ts's `guidance` /
-- `guidanceNote` fields — see that file's comment for why the two are kept
-- in sync. Run this once in the Supabase SQL Editor, same as 0001_init.sql.

alter table public.caf_igps add column if not exists guidance text not null default '';
alter table public.caf_igps add column if not exists guidance_note text;

update public.caf_igps set guidance =
  'Security governance is owned and directed at board level, with a named individual holding overall accountability. The board receives regular, accurate reporting and understands how security supports the essential function. Roles and responsibilities are clearly defined and understood at every level, and risk decisions are made by people with the right skills, authority and visibility of the organisation''s risk appetite.'
  where code = 'A1.a';

update public.caf_igps set guidance =
  'Risk to network and information systems is assessed and managed systematically, informed by a clear, current understanding of the relevant threat actors and their likely methods. Risk management processes evolve as the technical estate, threats and business context change, and are reviewed regularly for effectiveness. Assurance methods (testing, audits) give confidence that protective measures actually work, with gaps remediated promptly.'
  where code = 'A2.a';

update public.caf_igps set guidance =
  'A complete, current inventory exists of everything needed to deliver the essential function — including IT, OT and supporting infrastructure — with dependencies between assets understood and documented. Assets are prioritised by criticality, ownership is clearly assigned, and security is considered from creation through to decommissioning.'
  where code = 'A3.a';

update public.caf_igps set guidance =
  'The organisation understands its full supply chain, including sub-contractors, and factors supplier ownership, location and security posture into procurement decisions. Contracts clearly define security responsibilities, and critical suppliers are held to security standards appropriate to the threats faced. Software supply chains are managed with visibility of components, secure development practices, and verification of release integrity.'
  where code = 'A4.a';

update public.caf_igps set guidance =
  'Security policies, processes and procedures are documented, communicated and enforced consistently, reflecting real working practices rather than being purely theoretical. They are reviewed regularly — including in response to incidents and changes — and cyber security is embedded across other organisational policies (e.g. HR, physical access), with leadership visibility of how well they''re followed.'
  where code = 'B1.a';

update public.caf_igps set guidance =
  'Access to systems supporting the essential function is granted only after high-confidence identity verification, with multi-factor authentication required for all users, including remote access. Privileged actions are carried out from dedicated, tightly controlled devices, access rights are reviewed at least every six months, and third-party access is time-limited. All access is logged, correlated and regularly audited, with unauthorised attempts investigated promptly.'
  where code = 'B2.a';

update public.caf_igps set guidance =
  'Critical data is inventoried, and its handling — including who can access it — is understood and kept current. Data in transit and at rest is protected with encryption and access controls proportionate to its sensitivity, backups are tested and held securely (including offline copies), and mobile devices are managed centrally with the ability to remotely wipe them. Devices and media are properly sanitised before reuse or disposal.'
  where code = 'B3.a';

update public.caf_igps set guidance =
  'Systems are segmented into security zones with simple, well-understood data flows, and designed to recover gracefully rather than fail outright. Configuration is baselined and changes are controlled, administration is restricted to trusted users on dedicated devices, and vulnerabilities are tracked and patched promptly across the full technology stack. Software and hardware are kept on actively supported versions wherever possible.'
  where code = 'B4.a';

update public.caf_igps set guidance =
  'Business continuity and disaster recovery plans are tested through multiple methods — failover tests, tabletop exercises and, where appropriate, red-teaming — and threat intelligence feeds into ongoing resilience decisions. Critical networks are segregated from general business and external systems, single points of failure and resource constraints are identified and mitigated, and backups plus redundant systems or providers are in place for critical functions.'
  where code = 'B5.a';

update public.caf_igps set guidance =
  'Leadership visibly prioritises security and staff understand their own role in protecting the essential function. Reporting security concerns is encouraged and treated positively, with no blame culture discouraging disclosure. Training is tailored, tracked and refreshed regularly across all levels of the organisation, and its effectiveness is evaluated rather than just attendance being recorded.'
  where code = 'B6.a';

update public.caf_igps set guidance =
  'Monitoring coverage is designed around a clear understanding of the systems in scope and how attackers are likely to behave, combining host- and network-based detection. Logs are collected from all relevant sources, time-synchronised, and reviewed in near real time, with alerts enriched automatically and triage procedures documented and tested. Analysts understand normal behaviour well enough to reliably spot the abnormal, and threat intelligence keeps detection relevant.'
  where code = 'C1.a';

update public.caf_igps set
  guidance = 'Resources are allocated for regular, risk-based hunting for threats that evade automated controls, using a documented, repeatable methodology focused on attacker behaviour rather than isolated indicators. Successful hunts are converted into new automated detections, findings are recorded and analysed to improve the wider security posture, and the hunting process itself is reviewed and improved over time.',
  guidance_note = 'NCSC renamed this principle "Threat Hunting" in CAF v4.0 — shown here under its original name to match the rest of this trial.'
  where code = 'C2.a';

update public.caf_igps set guidance =
  'Incident response plans are grounded in a realistic assessment of risk, covering both known attack patterns and novel scenarios, and are integrated with wider business continuity and supply chain planning. Roles, resourcing and authority to act are clear, and the organisation can maintain reduced-capacity operation if needed. Plans are tested regularly through exercises based on real incidents and threat intelligence, covering the full incident lifecycle including recovery, with findings used to improve them.'
  where code = 'D1.a';

update public.caf_igps set guidance =
  'Every incident — and near-miss — triggers a structured review covering organisational, technical, human and threat-related factors, not just a technical post-mortem. Findings are used to improve reporting, governance, skills, policy and technical controls, with material issues escalated to senior leadership and fed into risk management. The organisation also learns from sector-wide and national incidents, not only its own.'
  where code = 'D2.a';

update public.caf_igps set
  guidance = 'Physical access to sites and facilities supporting the essential function is restricted to authorised individuals, verified at the point of entry. Visitors are signed in, escorted where appropriate, and access logs are retained for a defined period to support investigation if needed.',
  guidance_note = 'Physical security isn''t a formal CAF objective — NCSC''s framework covers Objectives A–D only. This section reflects general good practice, not an official CAF indicator.'
  where code = 'E1.a';

update public.caf_igps set
  guidance = 'Site perimeters are protected by physical controls (fencing, barriers, alarms) appropriate to the sensitivity of what''s inside, with continuous monitoring — e.g. CCTV — covering the most critical sites. Alerts from perimeter systems are routed to a monitored response capability, not just recorded for later review.',
  guidance_note = 'Physical security isn''t a formal CAF objective — NCSC''s framework covers Objectives A–D only. This section reflects general good practice, not an official CAF indicator.'
  where code = 'E2.a';
