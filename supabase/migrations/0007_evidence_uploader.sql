-- Evidence already tracked who reviewed it (reviewed_by) but not who
-- submitted it in the first place — an odd asymmetry for a compliance
-- tool. Stamped server-side by a trigger, same as reviewed_by/reviewed_at,
-- so it can't be spoofed by whatever an insert happens to send.

alter table public.evidence_files add column if not exists uploaded_by uuid references auth.users (id);

create or replace function public.stamp_evidence_uploader()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.uploaded_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists evidence_uploader_stamp on public.evidence_files;
create trigger evidence_uploader_stamp
  before insert on public.evidence_files
  for each row execute function public.stamp_evidence_uploader();
