-- v2 rearchitecture: statement text for all 20 Section B contributing
-- outcomes (the real numbered IGP statements caf_igp_statements holds).
-- Section B piloted first per docs/v2-rearchitecture-design.md §6.
--
-- Source: Ofgem's "NIS Supplementary Guidance and CAF Overlay for DGE
-- Sector" (TLP:WHITE, v3.0, Feb 2024), Annex B.2. Transcribed directly
-- from the source PDF's own "Partially achieved" / "Achieved" columns
-- per outcome — statement_number continues across both (matching the
-- document's own numbering), achieved-tier statements frequently
-- restate or strengthen their partial-tier counterpart rather than
-- replacing them outright, which is the document's own pattern, not a
-- transcription artifact.
--
-- 160 statements total across the 20 outcomes. "Not achieved" criteria
-- are deliberately not modelled as rows (see design doc §3.1 — they're
-- negative conditions, not positive checks a reviewer ticks off).

insert into public.caf_igp_statements (igp_code, statement_number, level, statement, sort_order) values

-- B1.a — Policy and Process Development (2 partial, 6 achieved)
('B1.a', 1, 'partially_achieved', 'Your policies and processes document your overarching security governance and risk management approach, technical security practice and specific regulatory compliance.', 1),
('B1.a', 2, 'partially_achieved', 'You review and update policies and processes in response to major cyber security incidents.', 2),
('B1.a', 3, 'achieved', 'You fully document your overarching security governance and risk management approach, technical security practice and specific regulatory compliance. Cyber security is integrated and embedded throughout these policies and processes and key performance indicators are reported to your executive management.', 3),
('B1.a', 4, 'achieved', 'Your organisation''s policies and processes are developed to be practical, usable and appropriate for your essential function and your technologies.', 4),
('B1.a', 5, 'achieved', 'Policies and processes that rely on user behaviour are practical, appropriate and achievable.', 5),
('B1.a', 6, 'achieved', 'You review and update policies and processes at suitably regular intervals to ensure they remain relevant. This is in addition to reviews following a major cyber security incident.', 6),
('B1.a', 7, 'achieved', 'Any changes to the essential function or the threat it faces triggers a review of policies and processes.', 7),
('B1.a', 8, 'achieved', 'Your systems are designed so that they remain secure even when user security policies and processes are not always followed.', 8),

-- B1.b — Policy and Process Implementation (4 partial, 4 achieved)
('B1.b', 1, 'partially_achieved', 'Most of your policies and processes are followed and their application is monitored.', 1),
('B1.b', 2, 'partially_achieved', 'Your policies and processes are integrated with other organisational policies and processes, including HR assessments of individuals'' trustworthiness.', 2),
('B1.b', 3, 'partially_achieved', 'All staff are aware of their responsibilities under your policies and processes.', 3),
('B1.b', 4, 'partially_achieved', 'All breaches of policies and processes with the potential to adversely impact the essential function are fully investigated. Other breaches are tracked, assessed for trends and action is taken to understand and address.', 4),
('B1.b', 5, 'achieved', 'All your policies and processes are followed, their correct application and security effectiveness is evaluated.', 5),
('B1.b', 6, 'achieved', 'Your policies and processes are integrated with other organisational policies and processes, including HR assessments of individuals'' trustworthiness.', 6),
('B1.b', 7, 'achieved', 'Your policies and processes are effectively and appropriately communicated across all levels of the organisation resulting in good staff awareness of their responsibilities.', 7),
('B1.b', 8, 'achieved', 'Appropriate action is taken to address all breaches of policies and processes with potential to adversely impact the essential function including aggregated breaches.', 8),

-- B2.a — Identity Verification, Authentication and Authorisation (6 partial, 6 achieved)
('B2.a', 1, 'partially_achieved', 'Your process of initial identity verification is robust enough to provide a reasonable level of confidence of a user''s identity profile before allowing an authorised user access to networks and information systems that support your essential function.', 1),
('B2.a', 2, 'partially_achieved', 'All authorised users and systems with access to networks or information systems on which your essential function depends are individually identified and authenticated.', 2),
('B2.a', 3, 'partially_achieved', 'The number of authorised users and systems that have access to essential function networks and information systems is limited to the minimum necessary.', 3),
('B2.a', 4, 'partially_achieved', 'You use additional authentication mechanisms, such as multi-factor (MFA), for privileged access to sensitive systems including Operational Technology where appropriate.', 4),
('B2.a', 5, 'partially_achieved', 'You individually authenticate and authorise all remote access to all your networks and information systems that support your essential function.', 5),
('B2.a', 6, 'partially_achieved', 'The list of users and systems with access to essential function networks and systems is reviewed on a regular basis at least annually.', 6),
('B2.a', 7, 'achieved', 'Your process of initial identity verification is robust enough to provide a high level of confidence of a user''s identity profile before allowing an authorised user access to networks and information systems that support your essential function.', 7),
('B2.a', 8, 'achieved', 'Only authorised and individually authenticated users can physically access and logically connect to your networks or information systems on which your essential function depends.', 8),
('B2.a', 9, 'achieved', 'The number of authorised users and systems that have access to all your networks and information systems supporting the essential function is limited to the minimum necessary.', 9),
('B2.a', 10, 'achieved', 'You use additional authentication mechanisms, such as multi-factor (MFA), for privileged access to all systems that operate or support your essential function.', 10),
('B2.a', 11, 'achieved', 'You use additional authentication mechanisms, such as multi-factor (MFA), when you individually authenticate and authorise all remote user access to all your networks and information systems that support your essential function.', 11),
('B2.a', 12, 'achieved', 'The list of users with access to networks and systems supporting and delivering the essential function is reviewed on a regular basis, at least every six months.', 12),

-- B2.b — Device Management (5 partial, 4 achieved)
('B2.b', 1, 'partially_achieved', 'Only corporately owned and managed devices can access your essential function''s networks and information systems.', 1),
('B2.b', 2, 'partially_achieved', 'All privileged access occurs from corporately managed devices dedicated to management functions.', 2),
('B2.b', 3, 'partially_achieved', 'You have sought to understand the security properties of third-party devices and networks before they can be connected to your systems. You have taken appropriate steps to mitigate any risks identified.', 3),
('B2.b', 4, 'partially_achieved', 'The act of connecting to a network port or cable does not grant access to any systems.', 4),
('B2.b', 5, 'partially_achieved', 'You are able to detect unknown devices being connected to your network and investigate such incidents.', 5),
('B2.b', 6, 'achieved', 'Dedicated devices are used for privileged actions (such as administration or accessing the essential function''s network and information systems). These devices are not used for directly browsing the web or accessing email.', 6),
('B2.b', 7, 'achieved', 'You either obtain independent and professional assurance of the security of third-party devices or networks before they connect to your systems, or you only allow third-party devices or networks dedicated to supporting your systems to connect.', 7),
('B2.b', 8, 'achieved', 'You perform certificate-based device identity management and only allow known devices to access systems necessary for the operation of your essential function.', 8),
('B2.b', 9, 'achieved', 'You perform regular scans to detect unknown devices and investigate any findings.', 9),

-- B2.c — Privileged User Management (4 partial, 5 achieved)
('B2.c', 1, 'partially_achieved', 'Privileged user access requires additional validation, but this does not use a strong form of authentication (e.g. multi-factor (MFA) or additional real-time security monitoring).', 1),
('B2.c', 2, 'partially_achieved', 'The identities of the individuals with privileged access to your essential function systems (infrastructure, platforms, software, configuration, etc) are known and managed. This includes third parties.', 2),
('B2.c', 3, 'partially_achieved', 'Activity by privileged users is routinely reviewed and validated (e.g. at least annually).', 3),
('B2.c', 4, 'partially_achieved', 'Privileged users are only granted specific privileged permissions which are essential to their business role or function.', 4),
('B2.c', 5, 'achieved', 'Privileged user access to your essential function systems is carried out from dedicated separate accounts that are closely monitored and managed.', 5),
('B2.c', 6, 'achieved', 'The issuing of temporary, time-bound rights for privileged user access and external third-party support access is in place.', 6),
('B2.c', 7, 'achieved', 'Privileged user access rights are regularly reviewed and always updated as part of your joiners, movers and leavers process.', 7),
('B2.c', 8, 'achieved', 'All privileged user access to your networks and information systems requires strong authentication, such as multi-factor (MFA) or additional real-time security monitoring.', 8),
('B2.c', 9, 'achieved', 'All privileged user activity is routinely reviewed, validated and recorded for offline analysis and investigation.', 9),

-- B2.d — Identity and Access Management (IdAM) (4 partial, 5 achieved)
('B2.d', 1, 'partially_achieved', 'You follow a robust procedure to verify each user and issue the minimum required access rights.', 1),
('B2.d', 2, 'partially_achieved', 'You regularly review access rights and those no longer needed are revoked.', 2),
('B2.d', 3, 'partially_achieved', 'User access rights are reviewed when users change roles via your joiners, leavers and movers process.', 3),
('B2.d', 4, 'partially_achieved', 'All user, device and system access to the systems supporting the essential function is logged and monitored, but it is not compared to other log data or access records.', 4),
('B2.d', 5, 'achieved', 'You follow a robust procedure to verify each user and issue the minimum required access rights, and the application of the procedure is regularly audited.', 5),
('B2.d', 6, 'achieved', 'User permissions are reviewed both when people change roles via your joiners, leavers and movers process and at regular intervals - at least annually.', 6),
('B2.d', 7, 'achieved', 'All user, device and systems access to the systems supporting the essential function is logged and monitored.', 7),
('B2.d', 8, 'achieved', 'You regularly review access logs and correlate this data with other access records and expected activity.', 8),
('B2.d', 9, 'achieved', 'Attempts by unauthorised users, devices or systems to connect to the systems supporting the essential function are alerted, promptly assessed and investigated.', 9),

-- B3.a — Understanding Data (6 partial, 9 achieved)
('B3.a', 1, 'partially_achieved', 'You have identified and catalogued all the data important to the operation of the essential function, or that would assist an attacker.', 1),
('B3.a', 2, 'partially_achieved', 'You have identified and catalogued who has access to the data important to the operation of the essential function.', 2),
('B3.a', 3, 'partially_achieved', 'You periodically review location, transmission, quantity and quality of data important to the operation of the essential function.', 3),
('B3.a', 4, 'partially_achieved', 'You have identified all mobile devices and media that hold data important to the operation of the essential function.', 4),
('B3.a', 5, 'partially_achieved', 'You understand and document the impact on your essential function of all relevant scenarios, including unauthorised access, modification or deletion, or when authorised users are unable to appropriately access this data.', 5),
('B3.a', 6, 'partially_achieved', 'You occasionally validate these documented impact statements.', 6),
('B3.a', 7, 'achieved', 'You have identified and catalogued all the data important to the operation of the essential function, or that would assist an attacker.', 7),
('B3.a', 8, 'achieved', 'You have identified and catalogued who has access to the data important to the operation of the essential function.', 8),
('B3.a', 9, 'achieved', 'You maintain a current understanding of the location, quantity and quality of data important to the operation of the essential function.', 9),
('B3.a', 10, 'achieved', 'You take steps to remove or minimise unnecessary copies or unneeded historic data.', 10),
('B3.a', 11, 'achieved', 'You have identified all mobile devices and media that may hold data important to the operation of the essential function.', 11),
('B3.a', 12, 'achieved', 'You maintain a current understanding of the data links used to transmit data that is important to your essential function.', 12),
('B3.a', 13, 'achieved', 'You understand the context, limitations and dependencies of your important data.', 13),
('B3.a', 14, 'achieved', 'You understand and document the impact on your essential function of all relevant scenarios, including unauthorised data access, modification or deletion, or when authorised users are unable to appropriately access this data.', 14),
('B3.a', 15, 'achieved', 'You validate these documented impact statements regularly, at least annually.', 15),

-- B3.b — Data in Transit (2 partial, 3 achieved)
('B3.b', 1, 'partially_achieved', 'You have identified and protected (effectively and proportionately) all the data links that carry data important to the operation of your essential function.', 1),
('B3.b', 2, 'partially_achieved', 'You apply appropriate technical means (e.g. cryptography) to protect data that travels over non-trusted or openly accessible carriers, but you have limited or no confidence in the robustness of the protection applied.', 2),
('B3.b', 3, 'achieved', 'You have identified and protected (effectively and proportionately) all the data links that carry data important to the operation of your essential function.', 3),
('B3.b', 4, 'achieved', 'You apply appropriate physical and / or technical means to protect data that travels over non-trusted or openly accessible carriers, with justified confidence in the robustness of the protection applied.', 4),
('B3.b', 5, 'achieved', 'Suitable alternative transmission paths are available where there is a significant risk of impact on the operation of the essential function due to resource limitation (e.g. transmission equipment or function failure, or important data being blocked or jammed).', 5),

-- B3.c — Stored Data (4 partial, 5 achieved)
('B3.c', 1, 'partially_achieved', 'All copies of data important to the operation of your essential function are necessary. Where this important data is transferred to less secure systems, the data is provided with limited detail and / or as a read-only copy.', 1),
('B3.c', 2, 'partially_achieved', 'You have applied suitable physical and / or technical means to protect this important stored data from unauthorised access, modification or deletion.', 2),
('B3.c', 3, 'partially_achieved', 'If cryptographic protections are used, you apply suitable technical and procedural means, but you have limited or no confidence in the robustness of the protection applied.', 3),
('B3.c', 4, 'partially_achieved', 'You have suitable, secured backups of data to allow the operation of the essential function to continue should the original data not be available. This may include off-line or segregated backups, or appropriate alternative forms such as paper copies.', 4),
('B3.c', 5, 'achieved', 'You have only necessary copies of this data. Where data is transferred to less secure systems, the data is provided with limited detail and / or as a read-only copy.', 5),
('B3.c', 6, 'achieved', 'You have applied suitable physical or technical means to protect this important stored data from unauthorised access, modification or deletion.', 6),
('B3.c', 7, 'achieved', 'If cryptographic protections are used you apply suitable technical and procedural means, and you have justified confidence in the robustness of the protection applied.', 7),
('B3.c', 8, 'achieved', 'You have suitable, secured backups of data to allow the operation of the essential function to continue should the original data not be available. This may include off-line or segregated backups, or appropriate alternative forms such as paper copies.', 8),
('B3.c', 9, 'achieved', 'Necessary historic or archive data is suitably secured in storage.', 9),

-- B3.d — Mobile Data (3 partial, 3 achieved)
('B3.d', 1, 'partially_achieved', 'You know which mobile devices hold data important to the operation of the essential function.', 1),
('B3.d', 2, 'partially_achieved', 'Data important to the operation of the essential function is only stored on mobile devices with at least equivalent security standard to your organisation.', 2),
('B3.d', 3, 'partially_achieved', 'Data on mobile devices is technically secured.', 3),
('B3.d', 4, 'achieved', 'Mobile devices that hold data that is important to the operation of the essential function are catalogued, are under your organisation''s control and configured according to best practice for the platform, with appropriate technical and procedural policies in place.', 4),
('B3.d', 5, 'achieved', 'Your organisation can remotely wipe all mobile devices holding data important to the operation of essential function.', 5),
('B3.d', 6, 'achieved', 'You have minimised this data on these mobile devices. Some data may be automatically deleted off mobile devices after a certain period.', 6),

-- B3.e — Media / Equipment Sanitisation (1 partial, 2 achieved)
('B3.e', 1, 'partially_achieved', 'Data important to the operation of the essential function is removed from all devices, equipment and removable media before reuse and / or disposal.', 1),
('B3.e', 2, 'achieved', 'You catalogue and track all devices that contain data important to the operation of the essential function (whether a specific storage device or one with integral storage).', 2),
('B3.e', 3, 'achieved', 'All data important to the operation of the essential function is sanitised from all devices, equipment or removable media before reuse and / or disposal using an assured product or service.', 3),

-- B4.a — Secure by Design (5 partial, 5 achieved)
('B4.a', 1, 'partially_achieved', 'You employ appropriate expertise to design network and information systems.', 1),
('B4.a', 2, 'partially_achieved', 'You design strong boundary defences where your networks and information systems interface with other organisations or the world at large.', 2),
('B4.a', 3, 'partially_achieved', 'You design simple data flows between your networks and information systems and any external interface to enable effective monitoring.', 3),
('B4.a', 4, 'partially_achieved', 'You design to make network and information system recovery simple.', 4),
('B4.a', 5, 'partially_achieved', 'All inputs to operational systems are checked and validated at the network boundary where possible, or additional monitoring is in place for content-based attacks.', 5),
('B4.a', 6, 'achieved', 'You employ appropriate expertise to design network and information systems.', 6),
('B4.a', 7, 'achieved', 'Your networks and information systems are segregated into appropriate security zones, e.g. operational systems for the essential function are segregated in a highly trusted, more secure zone.', 7),
('B4.a', 8, 'achieved', 'The networks and information systems supporting your essential function are designed to have simple data flows between components to support effective security monitoring.', 8),
('B4.a', 9, 'achieved', 'The networks and information systems supporting your essential function are designed to be easy to recover.', 9),
('B4.a', 10, 'achieved', 'Content-based attacks are mitigated for all inputs to operational systems that affect the essential function (e.g. via transformation and inspection).', 10),

-- B4.b — Secure Configuration (5 partial, 7 achieved)
('B4.b', 1, 'partially_achieved', 'You have identified and documented the assets that need to be carefully configured to maintain the security of the essential function.', 1),
('B4.b', 2, 'partially_achieved', 'Secure platform and device builds are used across the estate.', 2),
('B4.b', 3, 'partially_achieved', 'Consistent, secure and minimal system and device configurations are applied across the same types of environment.', 3),
('B4.b', 4, 'partially_achieved', 'Changes and adjustments to security configuration at security boundaries with the networks and information systems supporting your essential function are approved and documented.', 4),
('B4.b', 5, 'partially_achieved', 'You verify software before installation is permitted.', 5),
('B4.b', 6, 'achieved', 'You have identified, documented and actively manage (e.g. maintain security configurations, patching, updating according to good practice) the assets that need to be carefully configured to maintain the security of the essential function.', 6),
('B4.b', 7, 'achieved', 'All platforms conform to your secure, defined baseline build, or the latest known good configuration version for that environment.', 7),
('B4.b', 8, 'achieved', 'You closely and effectively manage changes in your environment, ensuring that network and system configurations are secure and documented.', 8),
('B4.b', 9, 'achieved', 'You regularly review and validate that your network and information systems have the expected, secured settings and configuration.', 9),
('B4.b', 10, 'achieved', 'Only permitted software can be installed.', 10),
('B4.b', 11, 'achieved', 'Standard users are not able to change settings that would impact security or the business operation.', 11),
('B4.b', 12, 'achieved', 'If automated decision-making technologies are in use, their operation is well understood, and decisions can be replicated.', 12),

-- B4.c — Secure Management (3 partial, 3 achieved)
('B4.c', 1, 'partially_achieved', 'Your systems and devices supporting the operation of the essential function are only administered or maintained by authorised privileged users from dedicated devices.', 1),
('B4.c', 2, 'partially_achieved', 'Technical knowledge about networks and information systems, such as documentation and network diagrams, is regularly reviewed and updated.', 2),
('B4.c', 3, 'partially_achieved', 'You prevent, detect and remove malware or unauthorised software. You use technical, procedural and physical measures as necessary.', 3),
('B4.c', 4, 'achieved', 'Your systems and devices supporting the operation of the essential function are only administered or maintained by authorised privileged users from dedicated devices that are technically segregated and secured to the same level as the networks and systems being maintained.', 4),
('B4.c', 5, 'achieved', 'You regularly review and update technical knowledge about networks and information systems, such as documentation and network diagrams, and ensure they are securely stored.', 5),
('B4.c', 6, 'achieved', 'You prevent, detect and remove malware or unauthorised software. You use technical, procedural and physical measures as necessary.', 6),

-- B4.d — Vulnerability Management (5 partial, 4 achieved)
('B4.d', 1, 'partially_achieved', 'You maintain a current understanding of the exposure of your essential function to publicly known vulnerabilities.', 1),
('B4.d', 2, 'partially_achieved', 'Announced vulnerabilities for all software packages, network equipment and operating systems used to support your essential function are tracked, prioritised and externally exposed vulnerabilities are mitigated (e.g. by patching) promptly.', 2),
('B4.d', 3, 'partially_achieved', 'Some vulnerabilities that are not externally exposed have temporary mitigations for an extended period.', 3),
('B4.d', 4, 'partially_achieved', 'You have temporary mitigations for unsupported systems and software while pursuing migration to supported technology.', 4),
('B4.d', 5, 'partially_achieved', 'You regularly test to fully understand the vulnerabilities of the networks and information systems that support the operation of your essential function.', 5),
('B4.d', 6, 'achieved', 'You maintain a current understanding of the exposure of your essential function to publicly known vulnerabilities.', 6),
('B4.d', 7, 'achieved', 'Announced vulnerabilities for all software packages, network equipment and operating systems used to support the operation of your essential function are tracked, prioritised and mitigated (e.g. by patching) promptly.', 7),
('B4.d', 8, 'achieved', 'You regularly test to fully understand the vulnerabilities of the networks and information systems that support the operation of your essential function and verify this understanding with third-party testing.', 8),
('B4.d', 9, 'achieved', 'You maximise the use of supported software, firmware and hardware in your networks and information systems supporting your essential function.', 9),

-- B5.a — Resilience Preparation (2 partial, 2 achieved)
('B5.a', 1, 'partially_achieved', 'You know all networks, information systems and underlying technologies that are necessary to restore the operation of the essential function; and understand their interdependence.', 1),
('B5.a', 2, 'partially_achieved', 'You know the order in which systems need to be recovered to efficiently and effectively restore the operation of the essential function.', 2),
('B5.a', 3, 'achieved', 'You have business continuity and disaster recovery plans that have been tested for practicality, effectiveness and completeness. Appropriate use is made of different test methods, e.g. manual fail-over, table-top exercises, or red-teaming.', 3),
('B5.a', 4, 'achieved', 'You use your security awareness and threat intelligence sources, to make immediate and potentially temporary security changes in response to new threats, e.g. a widespread outbreak of very damaging malware.', 4),

-- B5.b — Design for Resilience (2 partial, 4 achieved)
('B5.b', 1, 'partially_achieved', 'Operational systems that support the operation of the essential function are logically separated from your business systems, e.g. they reside on the same network as the rest of the organisation, but within a DMZ. Internet access is not available from operational systems.', 1),
('B5.b', 2, 'partially_achieved', 'Resource limitations (e.g. network bandwidth, single network paths) have been identified but not fully mitigated.', 2),
('B5.b', 3, 'achieved', 'Operational systems that support the operation of the essential function are segregated from other business and external systems by appropriate technical and physical means, e.g. separate network and system infrastructure with independent user administration. Internet services are not accessible from operational systems.', 3),
('B5.b', 4, 'achieved', 'You have identified and mitigated all resource limitations, e.g. bandwidth limitations and single network paths.', 4),
('B5.b', 5, 'achieved', 'You have identified and mitigated any geographical constraints or weaknesses (e.g. systems that your essential function depends upon are replicated in another location, important network connectivity has alternative physical paths and service providers).', 5),
('B5.b', 6, 'achieved', 'You review and update assessments of dependencies, resource and geographical limitations and mitigations when necessary.', 6),

-- B5.c — Backups (2 partial, 2 achieved)
('B5.c', 1, 'partially_achieved', 'You have appropriately secured backups (including data, configuration information, software, equipment, processes and knowledge). These backups will be accessible to recover from an extreme event.', 1),
('B5.c', 2, 'partially_achieved', 'You routinely test backups to ensure that the backup process functions correctly and the backups are usable.', 2),
('B5.c', 3, 'achieved', 'Your comprehensive, automatic and tested technical and procedural backups are secured at centrally accessible or secondary sites to recover from an extreme event.', 3),
('B5.c', 4, 'achieved', 'Backups of all important data and information needed to recover the essential function are made, tested, documented and routinely reviewed.', 4),

-- B6.a — Cyber Security Culture (3 partial, 6 achieved)
('B6.a', 1, 'partially_achieved', 'Your executive management understand and widely communicate the importance of a positive cyber security culture. Positive attitudes, behaviours and expectations are described for your organisation.', 1),
('B6.a', 2, 'partially_achieved', 'All people in your organisation understand the contribution they make to the essential function''s cyber security.', 2),
('B6.a', 3, 'partially_achieved', 'All individuals in your organisation know who to contact and where to access more information about cyber security. They know how to raise a cyber security issue.', 3),
('B6.a', 4, 'achieved', 'Your executive management clearly and effectively communicates the importance of organisation''s cyber security priorities and objectives to all staff. Your organisation displays positive cyber security attitudes, behaviours and expectations.', 4),
('B6.a', 5, 'achieved', 'People in your organisation raising potential cyber security incidents and issues are treated positively.', 5),
('B6.a', 6, 'achieved', 'Individuals at all levels in your organisation routinely report concerns or issues about cyber security and are recognised for their contribution to keeping the organisation secure.', 6),
('B6.a', 7, 'achieved', 'Your management is seen to be committed to and actively involved in cyber security.', 7),
('B6.a', 8, 'achieved', 'Your organisation communicates openly about cyber security, with any concern being taken seriously.', 8),
('B6.a', 9, 'achieved', 'People across your organisation participate in cyber security activities and improvements, building joint ownership and bringing knowledge of their area of expertise.', 9),

-- B6.b — Cyber Security Training (3 partial, 4 achieved)
('B6.b', 1, 'partially_achieved', 'You have defined appropriate cyber security training and awareness activities for all roles in your organisation, from executives to the most junior roles.', 1),
('B6.b', 2, 'partially_achieved', 'You use a range of teaching and communication techniques for cyber security training and awareness to reach the widest audience effectively.', 2),
('B6.b', 3, 'partially_achieved', 'Cyber security information is easily available.', 3),
('B6.b', 4, 'achieved', 'All people in your organisation, from the most senior to the most junior, follow appropriate cyber security training paths.', 4),
('B6.b', 5, 'achieved', 'Each individual''s cyber security training is tracked and refreshed at suitable intervals.', 5),
('B6.b', 6, 'achieved', 'You routinely evaluate your cyber security training and awareness activities to ensure they reach the widest audience and are effective.', 6),
('B6.b', 7, 'achieved', 'You make cyber security information and good practice guidance easily accessible, widely available and you know it is referenced and used within your organisation.', 7)

on conflict (igp_code, statement_number) do update set
  level = excluded.level,
  statement = excluded.statement,
  sort_order = excluded.sort_order;
