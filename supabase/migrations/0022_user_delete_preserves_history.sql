-- Groundwork for admin user management (invite/disable/delete/reset
-- password/reset MFA — the actual actions are app-code, using the
-- Supabase Admin API, not this migration).
--
-- None of the columns below had an explicit ON DELETE behaviour, which
-- defaults to blocking the delete outright (RESTRICT) the moment a user
-- has ever reviewed evidence, owned an item, posted a comment, or done
-- anything audit-logged — in practice, almost immediately. The fix is
-- ON DELETE SET NULL, not CASCADE: deleting a user account must never
-- take their evidence, reviews, comments, or audit trail with it — that
-- would be actively wrong for a compliance tool. The record stays;
-- only the "who" attribution is lost.
--
-- (profiles.id, user_roles.user_id, supplier_igp_access.user_id,
-- notification_dismissals.user_id, statement_comment_mentions.
-- mentioned_user_id already cascade — correct as-is, those rows are
-- about the account itself, not independent historical records.)
--
-- Constraint names below were never set explicitly in earlier
-- migrations, so this looks them up by table+column rather than
-- guessing Postgres's auto-generated name, then replaces whichever it
-- finds with an explicitly-named ON DELETE SET NULL version.

create or replace function pg_temp.set_null_on_user_delete(p_table text, p_column text)
returns void
language plpgsql
as $$
declare
  conname text;
begin
  select tc.constraint_name into conname
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public' and tc.table_name = p_table
    and kcu.column_name = p_column and tc.constraint_type = 'FOREIGN KEY';

  if conname is not null then
    execute format('alter table public.%I drop constraint %I', p_table, conname);
  end if;

  execute format(
    'alter table public.%I add constraint %I foreign key (%I) references auth.users (id) on delete set null',
    p_table, p_table || '_' || p_column || '_fkey', p_column
  );
end;
$$;

select pg_temp.set_null_on_user_delete('evidence_files', 'uploaded_by');
select pg_temp.set_null_on_user_delete('evidence_files', 'reviewed_by');
select pg_temp.set_null_on_user_delete('igp_assessments', 'owner_id');
select pg_temp.set_null_on_user_delete('scope_items', 'owner_id');
select pg_temp.set_null_on_user_delete('audit_log', 'actor_id');
select pg_temp.set_null_on_user_delete('app_settings', 'updated_by');
select pg_temp.set_null_on_user_delete('cycle_snapshots', 'frozen_by');
select pg_temp.set_null_on_user_delete('igp_statement_assessments', 'reviewed_by');

-- A comment always has an author at post time (not null today), but
-- must survive that author's account being deleted — same reasoning
-- as everything above, just needs the column to allow null first.
alter table public.statement_comments alter column author_id drop not null;
select pg_temp.set_null_on_user_delete('statement_comments', 'author_id');
