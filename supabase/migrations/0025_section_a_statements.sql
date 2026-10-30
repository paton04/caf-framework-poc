-- v2 rearchitecture: statement text for all 7 Section A contributing
-- outcomes, same method as 0017 (Section B) — see that migration's
-- header for the full sourcing/verification approach. Source: Ofgem's
-- "NIS Supplementary Guidance and CAF Overlay for DGE Sector"
-- (TLP:WHITE, v3.0, Feb 2024), Annex B.1.
--
-- A1.a, A1.b, A1.c, A2.b, and A3.a have NO "partially achieved" tier at
-- all in the source document — only Not achieved / Achieved. That's
-- the real document's own structure, not a gap: caf_igp_statements'
-- `level` check constraint already only allows 'partially_achieved' or
-- 'achieved' per row, so these five outcomes simply have zero
-- partially_achieved rows, and the existing rollup logic
-- (recompute_igp_assessment_status) already handles that correctly —
-- an outcome with 0 partial-level statements can only ever derive to
-- achieved/not/none, never partial, which is exactly right for these.
--
-- 49 statements total across the 7 outcomes (0 partial + 4 achieved,
-- 0+3, 0+4, 6+9, 0+5, 0+5, 6+7).

insert into public.caf_igp_statements (igp_code, statement_number, level, statement, sort_order) values

-- A1.a — Board Direction (0 partial, 4 achieved)
('A1.a', 1, 'achieved', 'Your organisation''s approach and policy relating to the security of networks and information systems supporting the operation of essential functions are owned and managed at board level. These are communicated, in a meaningful way, to risk management decision-makers across the organisation.', 1),
('A1.a', 2, 'achieved', 'Regular board discussions on the security of network and information systems supporting the operation of your essential function take place, based on timely and accurate information and informed by expert guidance.', 2),
('A1.a', 3, 'achieved', 'There is a board-level individual who has overall accountability for the security of networks and information systems and drives regular discussion at board-level.', 3),
('A1.a', 4, 'achieved', 'Direction set at board level is translated into effective organisational practices that direct and control the security of the networks and information systems supporting your essential function.', 4),

-- A1.b — Roles and Responsibilities (0 partial, 3 achieved)
('A1.b', 1, 'achieved', 'Necessary roles and responsibilities for the security of networks and information systems supporting your essential function have been identified. These are reviewed periodically to ensure they remain fit for purpose.', 1),
('A1.b', 2, 'achieved', 'Appropriately capable and knowledgeable staff fill those roles and are given the time, authority, and resources to carry out their duties.', 2),
('A1.b', 3, 'achieved', 'There is clarity on who in your organisation has overall accountability for the security of the networks and information systems supporting your essential function.', 3),

-- A1.c — Decision Making (0 partial, 4 achieved)
('A1.c', 1, 'achieved', 'Senior management have visibility of key risk decisions made throughout the organisation.', 1),
('A1.c', 2, 'achieved', 'Risk management decision-makers understand their responsibilities for making effective and timely decisions in the context of the risk appetite regarding the essential function, as set by senior management.', 2),
('A1.c', 3, 'achieved', 'Risk management decision-making is delegated and escalated where necessary, across the organisation, to people who have the skills, knowledge, tools, and authority they need.', 3),
('A1.c', 4, 'achieved', 'Risk management decisions are periodically reviewed to ensure their continued relevance and validity.', 4),

-- A2.a — Risk Management Process (6 partial, 9 achieved)
('A2.a', 1, 'partially_achieved', 'Your organisational process ensures that security risks to networks and information systems relevant to essential functions are identified, analysed, prioritised, and managed.', 1),
('A2.a', 2, 'partially_achieved', 'Your risk assessments are informed by an understanding of the vulnerabilities in the networks and information systems supporting your essential function.', 2),
('A2.a', 3, 'partially_achieved', 'The output from your risk management process is a clear set of security requirements that will address the risks in line with your organisational approach to security.', 3),
('A2.a', 4, 'partially_achieved', 'Significant conclusions reached during your risk management process are communicated to key security decision-makers and accountable individuals.', 4),
('A2.a', 5, 'partially_achieved', 'You conduct risk assessments when significant events potentially affect the essential function, such as replacing a system or a change in the cyber security threat.', 5),
('A2.a', 6, 'partially_achieved', 'You perform threat analysis and understand how generic threats apply to your organisation.', 6),
('A2.a', 7, 'achieved', 'Your organisational process ensures that security risks to networks and information systems relevant to essential functions are identified, analysed, prioritised, and managed.', 7),
('A2.a', 8, 'achieved', 'Your approach to risk is focused on the possibility of adverse impact to your essential function, leading to a detailed understanding of how such impact might arise as a consequence of possible attacker actions and the security properties of your networks and information systems.', 8),
('A2.a', 9, 'achieved', 'Your risk assessments are based on a clearly understood set of threat assumptions, informed by an up-to-date understanding of security threats to your essential function and your sector.', 9),
('A2.a', 10, 'achieved', 'Your risk assessments are informed by an understanding of the vulnerabilities in the networks and information systems supporting your essential function.', 10),
('A2.a', 11, 'achieved', 'The output from your risk management process is a clear set of security requirements that will address the risks in line with your organisational approach to security.', 11),
('A2.a', 12, 'achieved', 'Significant conclusions reached during your risk management process are communicated to key security decision-makers and accountable individuals.', 12),
('A2.a', 13, 'achieved', 'Your risk assessments are dynamic and updated in the light of relevant changes which may include technical changes to networks and information systems, change of use and new threat information.', 13),
('A2.a', 14, 'achieved', 'The effectiveness of your risk management process is reviewed periodically, and improvements made as required.', 14),
('A2.a', 15, 'achieved', 'You perform detailed threat analysis and understand how this applies to your organisation in the context of the threat to your sector and the wider CNI.', 15),

-- A2.b — Assurance (0 partial, 5 achieved)
('A2.b', 1, 'achieved', 'You validate that the security measures in place to protect the networks and information systems are effective and remain effective for the lifetime over which they are needed.', 1),
('A2.b', 2, 'achieved', 'You understand the assurance methods available to you and choose appropriate methods to gain confidence in the security of essential functions.', 2),
('A2.b', 3, 'achieved', 'Your confidence in the security as it relates to your technology, people, and processes can be justified to, and verified by, a third party.', 3),
('A2.b', 4, 'achieved', 'Security deficiencies uncovered by assurance activities are assessed, prioritised and remedied when necessary, in a timely and effective way.', 4),
('A2.b', 5, 'achieved', 'The methods used for assurance are reviewed to ensure they are working as intended and remain the most appropriate method to use.', 5),

-- A3.a — Asset Management (0 partial, 5 achieved)
('A3.a', 1, 'achieved', 'All assets relevant to the secure operation of essential functions are identified and inventoried (at a suitable level of detail). The inventory is kept up to date.', 1),
('A3.a', 2, 'achieved', 'Dependencies on supporting infrastructure (e.g. power, cooling etc) are recognised and recorded.', 2),
('A3.a', 3, 'achieved', 'You have prioritised your assets according to their importance to the operation of the essential function.', 3),
('A3.a', 4, 'achieved', 'You have assigned responsibility for managing physical assets.', 4),
('A3.a', 5, 'achieved', 'Assets relevant to essential functions are managed with cyber security in mind throughout their lifecycle, from creation through to eventual decommissioning or disposal.', 5),

-- A4.a — Supply Chain (6 partial, 7 achieved)
('A4.a', 1, 'partially_achieved', 'You understand the general risks suppliers may pose to your essential functions.', 1),
('A4.a', 2, 'partially_achieved', 'You know the extent of your supply chain for essential functions, including sub-contractors.', 2),
('A4.a', 3, 'partially_achieved', 'You understand which contracts are relevant and you include appropriate security obligations in relevant contracts.', 3),
('A4.a', 4, 'partially_achieved', 'You are aware of all third-party connections and have assurance that they meet your organisation''s security requirements.', 4),
('A4.a', 5, 'partially_achieved', 'Your approach to security incident management considers incidents that might arise in your supply chain.', 5),
('A4.a', 6, 'partially_achieved', 'You have confidence that information shared with suppliers that is necessary for the operation of your essential function is appropriately protected from well-known attacks and known vulnerabilities.', 6),
('A4.a', 7, 'achieved', 'You have a deep understanding of your supply chain, including sub-contractors and the wider risks it faces. You consider factors such as supplier''s partnerships, competitors, nationality and other organisations with which they sub-contract. This informs your risk assessment and procurement processes.', 7),
('A4.a', 8, 'achieved', 'Your approach to supply chain risk management considers the risks to your essential functions arising from supply chain subversion by capable and well-resourced attackers.', 8),
('A4.a', 9, 'achieved', 'You have confidence that information shared with suppliers that is essential to the operation of your function is appropriately protected from sophisticated attacks.', 9),
('A4.a', 10, 'achieved', 'You understand which contracts are relevant and you include appropriate security obligations in relevant contracts. You have a proactive approach to contract management which may include a contract management plan for relevant contracts.', 10),
('A4.a', 11, 'achieved', 'Customer / supplier ownership of responsibilities are laid out in contracts.', 11),
('A4.a', 12, 'achieved', 'All network connections and data sharing with third parties is managed effectively and proportionately.', 12),
('A4.a', 13, 'achieved', 'When appropriate, your incident management process and that of your suppliers provide mutual support in the resolution of incidents.', 13)

on conflict (igp_code, statement_number) do update set
  level = excluded.level,
  statement = excluded.statement,
  sort_order = excluded.sort_order;
