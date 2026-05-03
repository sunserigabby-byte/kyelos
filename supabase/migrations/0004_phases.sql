-- Migration 0004: phase system + Phase 2 (Puerto Rico Vacation)
-- Idempotent — safe to re-run.

-- ============================================
-- 1. phases table + seed
-- ============================================

create table if not exists phases (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  name text not null,
  phase_type text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table phases enable row level security;
drop policy if exists "public_read_phases" on phases;
drop policy if exists "public_write_phases" on phases;
drop policy if exists "public_update_phases" on phases;
create policy "public_read_phases" on phases for select using (true);
create policy "public_write_phases" on phases for insert with check (true);
create policy "public_update_phases" on phases for update using (true);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='phases') then
    alter publication supabase_realtime add table phases;
  end if;
end $$;

-- Seed phases (no-op on conflict — natural key = person + name)
do $$
begin
  if not exists (select 1 from phases where person='gabby' and name='10-Day Cut Protocol') then
    insert into phases (person, name, phase_type, start_date, end_date, is_active)
      values ('gabby', '10-Day Cut Protocol', 'cut', '2026-04-23', '2026-05-02', false);
  end if;
  if not exists (select 1 from phases where person='gabby' and name='Puerto Rico Vacation') then
    insert into phases (person, name, phase_type, start_date, end_date, is_active)
      values ('gabby', 'Puerto Rico Vacation', 'vacation', '2026-05-02', '2026-05-09', true);
  end if;
  if not exists (select 1 from phases where person='jon' and name='10-Day Cut Protocol') then
    insert into phases (person, name, phase_type, start_date, end_date, is_active)
      values ('jon', '10-Day Cut Protocol', 'cut', '2026-04-23', '2026-05-02', false);
  end if;
  if not exists (select 1 from phases where person='jon' and name='Puerto Rico Vacation') then
    insert into phases (person, name, phase_type, start_date, end_date, is_active)
      values ('jon', 'Puerto Rico Vacation', 'vacation', '2026-05-02', '2026-05-09', true);
  end if;
end $$;

-- ============================================
-- 2. phase_id columns + new tracking columns
-- ============================================

alter table daily_logs   add column if not exists phase_id uuid references phases(id);
alter table completions  add column if not exists phase_id uuid references phases(id);

alter table daily_logs add column if not exists diet_sodas       int default 0;
alter table daily_logs add column if not exists recovery_mode    boolean default false;
alter table daily_logs add column if not exists protein_g        int default 0;
alter table daily_logs add column if not exists dandelion_count  int default 0;

-- ============================================
-- 3. Backfill existing rows with the cut phase id (per person)
-- ============================================

update daily_logs dl set phase_id = p.id
  from phases p
  where dl.phase_id is null
    and p.person = dl.person
    and p.phase_type = 'cut';

update completions c set phase_id = p.id
  from phases p
  where c.phase_id is null
    and p.person = c.person
    and p.phase_type = 'cut';

-- ============================================
-- 4. Update unique constraints to include phase_id
-- ============================================

-- Drop any unique constraints matching the OLD pattern (whatever Postgres
-- named them when the tables were originally created).
do $$
declare con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid='public.daily_logs'::regclass
      and contype='u'
      and pg_get_constraintdef(oid) ilike '%(person, day_num)%'
      and pg_get_constraintdef(oid) not ilike '%phase_id%'
  loop
    execute format('alter table daily_logs drop constraint %I', con.conname);
  end loop;
end $$;

do $$
declare con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid='public.completions'::regclass
      and contype='u'
      and pg_get_constraintdef(oid) ilike '%(person, day_num, item_key)%'
      and pg_get_constraintdef(oid) not ilike '%phase_id%'
  loop
    execute format('alter table completions drop constraint %I', con.conname);
  end loop;
end $$;

-- Add new constraints (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='daily_logs_person_day_phase_unique'
      and conrelid='public.daily_logs'::regclass
  ) then
    alter table daily_logs
      add constraint daily_logs_person_day_phase_unique
      unique (person, day_num, phase_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='completions_person_day_item_phase_unique'
      and conrelid='public.completions'::regclass
  ) then
    alter table completions
      add constraint completions_person_day_item_phase_unique
      unique (person, day_num, item_key, phase_id);
  end if;
end $$;
