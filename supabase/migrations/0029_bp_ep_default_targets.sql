-- Populates caf_igps.bp_required_level / ep_required_level, which have
-- sat empty since 0015 (blocked on finding DESNZ's "Initial Target
-- Attainment Levels of Expected Cyber Resilience by the DGE
-- Subsectors" — the actual per-outcome target table Ofgem's own CAF
-- Overlay cites as the real source, see docs/v2-rearchitecture-design.md
-- §2). Not found publicly after two separate search passes — it looks
-- like it may be shared directly with regulated entities rather than
-- published, not something this session can locate.
--
-- Per Fiona (2026-10-30): go ahead without it rather than leave the
-- field empty indefinitely. This is a DELIBERATE, TRANSPARENT DEFAULT,
-- not a reconstruction of the real DESNZ table — nowhere does this
-- claim to be Ofgem's actual per-outcome requirement. The real table
-- almost certainly varies requirement by outcome (some outcomes
-- plausibly stay at Partially achieved even under the Enhanced
-- Profile); this is a uniform placeholder so the mechanism has
-- something to compute against, not a stand-in for the genuine
-- regulatory thresholds. Replace per-outcome once the real table (or
-- Simon/Agha) confirms specifics — this migration only ever sets rows
-- that are still null, so a later correction won't be clobbered by
-- rerunning this file.
--
-- Default: Basic Profile = Partially achieved, Enhanced Profile =
-- Achieved, for any outcome that actually has a partially-achieved
-- tier among its statements. For the 14 outcomes with no partial tier
-- at all (achieved/not-achieved only — see 0025/0026/0027/0028's
-- header comments), both profiles require Achieved, since there's no
-- intermediate state to set a lower Basic-Profile bar at.

update public.caf_igps
set
  bp_required_level = case
    when exists (
      select 1 from public.caf_igp_statements s
      where s.igp_code = caf_igps.code and s.level = 'partially_achieved'
    ) then 'partially_achieved'
    else 'achieved'
  end,
  ep_required_level = 'achieved'
where bp_required_level is null and ep_required_level is null;
