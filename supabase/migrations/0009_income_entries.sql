-- Migration 0009: per-person side-income entries for the ramp tracker.
-- Targets are code-defined (lib/income-ramp.ts) — this table just stores
-- the actual earned amounts. Idempotent.

create table if not exists income_entries (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  date date not null default current_date,
  amount numeric not null,
  source text,
  note text,
  created_at timestamptz default now()
);

create index if not exists income_entries_person_date_idx on income_entries(person, date desc);

alter table income_entries enable row level security;

drop policy if exists "public_read_income"   on income_entries;
drop policy if exists "public_write_income"  on income_entries;
drop policy if exists "public_update_income" on income_entries;
drop policy if exists "public_delete_income" on income_entries;
create policy "public_read_income"   on income_entries for select using (true);
create policy "public_write_income"  on income_entries for insert with check (true);
create policy "public_update_income" on income_entries for update using (true);
create policy "public_delete_income" on income_entries for delete using (true);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='income_entries') then
    alter publication supabase_realtime add table income_entries;
  end if;
end $$;
