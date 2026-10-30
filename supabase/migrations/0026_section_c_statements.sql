-- v2 rearchitecture: statement text for all 7 Section C contributing
-- outcomes, same method as 0017/0025 — see 0017's header for the full
-- sourcing/verification approach. Source: Ofgem's "NIS Supplementary
-- Guidance and CAF Overlay for DGE Sector" (TLP:WHITE, v3.0, Feb 2024),
-- Annex B.3.
--
-- C1.b, C1.c, and C1.e needed the column-position cross-check (not just
-- plain-text reading) to find the real partial/achieved split — the
-- semantic "achieved restates partial" pattern used elsewhere wasn't
-- obvious enough on these three to trust without verifying against the
-- actual column positions. C2.a and C2.b have no partially-achieved
-- tier at all (Not achieved/Achieved only), same situation as several
-- Section A outcomes.
--
-- 58 statements total (24 partial + 34 achieved) across the 7 outcomes.

insert into public.caf_igp_statements (igp_code, statement_number, level, statement, sort_order) values

-- C1.a — Monitoring Coverage (6 partial, 4 achieved)
('C1.a', 1, 'partially_achieved', 'Data relating to the security and operation of some areas of your essential functions is collected but coverage is not comprehensive.', 1),
('C1.a', 2, 'partially_achieved', 'You easily detect the presence or absence of IoCs on your essential function, such as known malicious command and control signatures.', 2),
('C1.a', 3, 'partially_achieved', 'Some user monitoring is done, but not covering a fully agreed list of suspicious or undesirable behaviour.', 3),
('C1.a', 4, 'partially_achieved', 'You monitor traffic crossing your network boundary (including IP address connections as a minimum).', 4),
('C1.a', 5, 'partially_achieved', 'Monitoring is based on an understanding of your networks, common cyber-attack methods and what you need awareness of in order to detect potential security incidents that could affect the operation of your essential function (e.g. presence of malware, malicious emails, user policy violations).', 5),
('C1.a', 6, 'partially_achieved', 'Your monitoring data provides enough detail to reliably detect security incidents that could affect the operation of your essential function.', 6),
('C1.a', 7, 'achieved', 'You easily detect the presence or absence of IoCs on your essential functions, such as known malicious command and control signatures.', 7),
('C1.a', 8, 'achieved', 'Extensive monitoring of user activity in relation to the operation of essential functions enables you to detect policy violations and an agreed list of suspicious or undesirable behaviour.', 8),
('C1.a', 9, 'achieved', 'You have extensive monitoring coverage that includes host-based monitoring and network gateways.', 9),
('C1.a', 10, 'achieved', 'All new systems are considered as potential monitoring data sources to maintain a comprehensive monitoring capability.', 10),

-- C1.b — Securing Logs (3 partial, 7 achieved)
('C1.b', 1, 'partially_achieved', 'Only authorised staff can view logging data for investigations.', 1),
('C1.b', 2, 'partially_achieved', 'Privileged users can view logging information.', 2),
('C1.b', 3, 'partially_achieved', 'There is some monitoring of access to logging data (e.g. copying, deleting or modification, or even viewing.)', 3),
('C1.b', 4, 'achieved', 'The integrity of logging data is protected, or any modification is detected and attributed.', 4),
('C1.b', 5, 'achieved', 'The logging architecture has mechanisms, processes and procedures to ensure that it can protect itself from threats comparable to those it is trying to identify. This includes protecting the function itself, and the data within it.', 5),
('C1.b', 6, 'achieved', 'Log data analysis and normalisation is only performed on copies of the data keeping the master copy unaltered.', 6),
('C1.b', 7, 'achieved', 'Logging datasets are synchronised, using an accurate common time source, so separate datasets can be correlated in different ways.', 7),
('C1.b', 8, 'achieved', 'Access to logging data is limited to those with business need and no others.', 8),
('C1.b', 9, 'achieved', 'All actions involving all logging data (e.g. copying, deleting or modification, or even viewing) can be traced back to a unique user.', 9),
('C1.b', 10, 'achieved', 'Legitimate reasons for accessing logging data are given in use policies.', 10),

-- C1.c — Generating Alerts (5 partial, 6 achieved)
('C1.c', 1, 'partially_achieved', 'Alerts from third party security software are investigated, and action taken.', 1),
('C1.c', 2, 'partially_achieved', 'Some, but not all, logging datasets can be easily queried with search tools to aid investigations.', 2),
('C1.c', 3, 'partially_achieved', 'The resolution of alerts to a network asset or system is performed regularly.', 3),
('C1.c', 4, 'partially_achieved', 'Security alerts relating to some essential functions are prioritised.', 4),
('C1.c', 5, 'partially_achieved', 'Logs are reviewed at regular intervals.', 5),
('C1.c', 6, 'achieved', 'Logging data is enriched with other network knowledge and data when investigating certain suspicious activity or alerts.', 6),
('C1.c', 7, 'achieved', 'A wide range of signatures and indicators of compromise is used for investigations of suspicious activity and alerts.', 7),
('C1.c', 8, 'achieved', 'Alerts can be easily resolved to network assets using knowledge of networks and systems. The resolution of these alerts is performed in almost real time.', 8),
('C1.c', 9, 'achieved', 'Security alerts relating to all essential functions are prioritised and this information is used to support incident management.', 9),
('C1.c', 10, 'achieved', 'Logs are reviewed almost continuously, in real time.', 10),
('C1.c', 11, 'achieved', 'Alerts are tested to ensure that they are generated reliably and that it is possible to distinguish genuine security incidents from false alarms.', 11),

-- C1.d — Identifying Security Incidents (4 partial, 4 achieved)
('C1.d', 1, 'partially_achieved', 'Your organisation uses some threat intelligence services, but you don''t necessarily choose sources or providers specifically because of your business needs, or specific threats in your sector (e.g. sector-based infoshare, ICS software vendors, anti-virus providers, specialist threat intel firms, special interest groups).', 1),
('C1.d', 2, 'partially_achieved', 'You receive updates for all your signature based protective technologies (e.g. AV, IDS).', 2),
('C1.d', 3, 'partially_achieved', 'You apply some updates, signatures and IoCs in a timely way.', 3),
('C1.d', 4, 'partially_achieved', 'You know how effective your threat intelligence is (e.g. by tracking how threat intelligence helps you identify security problems).', 4),
('C1.d', 5, 'achieved', 'You have selected threat intelligence feeds using risk-based and threat-informed decisions based on your business needs and sector (e.g. vendor reporting and patching, strong anti-virus providers, sector and community-based infoshare, special interest groups).', 5),
('C1.d', 6, 'achieved', 'You apply all new signatures and IoCs within a reasonable (risk-based) time of receiving them.', 6),
('C1.d', 7, 'achieved', 'You receive signature updates for all your protective technologies (e.g. AV, IDS).', 7),
('C1.d', 8, 'achieved', 'You track the effectiveness of your intelligence feeds and actively share feedback on the usefulness of IoCs and any other indicators with the threat community (e.g. sector partners, threat intelligence providers, Government agencies).', 8),

-- C1.e — Monitoring Tools and Skills (6 partial, 7 achieved)
('C1.e', 1, 'partially_achieved', 'Monitoring staff have some investigative skills and a basic understanding of the data they need to work with.', 1),
('C1.e', 2, 'partially_achieved', 'Monitoring staff can report to other parts of the organisation (e.g. security directors, resilience managers).', 2),
('C1.e', 3, 'partially_achieved', 'Monitoring staff are capable of following most of the required workflows.', 3),
('C1.e', 4, 'partially_achieved', 'Your monitoring tools can make use of logging that would capture most unsophisticated and untargeted attack types.', 4),
('C1.e', 5, 'partially_achieved', 'Your monitoring tools work with most logging data, with some configuration.', 5),
('C1.e', 6, 'partially_achieved', 'Monitoring staff are aware of some essential functions and can manage alerts relating to them.', 6),
('C1.e', 7, 'achieved', 'You have monitoring staff, who are responsible for the analysis, investigation and reporting of monitoring alerts covering both security and performance.', 7),
('C1.e', 8, 'achieved', 'Monitoring staff have defined roles and skills that cover all parts of the monitoring and investigation process.', 8),
('C1.e', 9, 'achieved', 'Monitoring staff follow process and procedures that address all governance reporting requirements, internal and external.', 9),
('C1.e', 10, 'achieved', 'Monitoring staff are empowered to look beyond the fixed process to investigate and understand non-standard threats, by developing their own investigative techniques and making new use of data.', 10),
('C1.e', 11, 'achieved', 'Your monitoring tools make use of all logging data collected to pinpoint activity within an incident.', 11),
('C1.e', 12, 'achieved', 'Monitoring staff and tools drive and shape new log data collection and can make wide use of it.', 12),
('C1.e', 13, 'achieved', 'Monitoring staff are aware of the operation of essential functions and related assets and can identify and prioritise alerts or investigations that relate to them.', 13),

-- C2.a — System Abnormalities for Attack Detection (0 partial, 4 achieved)
('C2.a', 1, 'achieved', 'Normal system behaviour is fully understood to such an extent that searching for system abnormalities is a potentially effective way of detecting malicious activity (e.g. you fully understand which systems should and should not communicate and when).', 1),
('C2.a', 2, 'achieved', 'System abnormality descriptions from past attacks and threat intelligence, on yours and other networks, are used to signify malicious activity.', 2),
('C2.a', 3, 'achieved', 'The system abnormalities you search for consider the nature of attacks likely to impact on the networks and information systems supporting the operation of essential functions.', 3),
('C2.a', 4, 'achieved', 'The system abnormality descriptions you use are updated to reflect changes in your networks and information systems and current threat intelligence.', 4),

-- C2.b — Proactive Attack Discovery (0 partial, 2 achieved)
('C2.b', 1, 'achieved', 'You routinely search for system abnormalities indicative of malicious activity on the networks and information systems supporting the operation of your essential function, generating alerts based on the results of such searches.', 1),
('C2.b', 2, 'achieved', 'You have justified confidence in the effectiveness of your searches for system abnormalities indicative of malicious activity.', 2)

on conflict (igp_code, statement_number) do update set
  level = excluded.level,
  statement = excluded.statement,
  sort_order = excluded.sort_order;
