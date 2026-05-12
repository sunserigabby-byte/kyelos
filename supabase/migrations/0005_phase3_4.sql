-- Migration 0005: Phase 3 (PRP Recovery + Volleyball Power) + Phase 4 (Tournament Peak)
-- Tournament date moved to Jun 26 → Phase 3 extends to Jun 19, Phase 4 = Jun 20-26.
-- Idempotent — safe to re-run.

-- ============================================
-- 1. New tables
-- ============================================

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  phase_id uuid references phases(id),
  day_num int not null,
  workout_name text not null,
  workout_date date not null,
  notes text,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_name text not null,
  set_number int not null,
  set_type text not null,
  weight numeric,
  reps int,
  duration_seconds int,
  rpe int check (rpe between 1 and 10),
  intent text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists meal_selections (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  phase_id uuid references phases(id),
  day_num int not null,
  meal_key text not null,
  protein_food text,
  protein_serving text,
  carb_food text,
  carb_serving text,
  fat_food text,
  fat_serving text,
  veggie_food text,
  veggie_serving text,
  custom_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(person, phase_id, day_num, meal_key)
);

create table if not exists cardio_logs (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  phase_id uuid references phases(id),
  day_num int not null,
  cardio_type text,
  duration_minutes int,
  completed boolean default false,
  created_at timestamptz default now()
);

create index if not exists workout_sessions_person_phase_idx on workout_sessions(person, phase_id);
create index if not exists set_logs_session_idx on set_logs(session_id);
create index if not exists set_logs_exercise_idx on set_logs(exercise_name, created_at desc);
create index if not exists meal_selections_lookup_idx on meal_selections(person, phase_id, day_num);

alter table workout_sessions enable row level security;
alter table set_logs enable row level security;
alter table meal_selections enable row level security;
alter table cardio_logs enable row level security;

drop policy if exists "public_read_sessions" on workout_sessions;
drop policy if exists "public_write_sessions" on workout_sessions;
drop policy if exists "public_update_sessions" on workout_sessions;
create policy "public_read_sessions"  on workout_sessions for select using (true);
create policy "public_write_sessions" on workout_sessions for insert with check (true);
create policy "public_update_sessions" on workout_sessions for update using (true);

drop policy if exists "public_read_sets" on set_logs;
drop policy if exists "public_write_sets" on set_logs;
drop policy if exists "public_update_sets" on set_logs;
drop policy if exists "public_delete_sets" on set_logs;
create policy "public_read_sets"   on set_logs for select using (true);
create policy "public_write_sets"  on set_logs for insert with check (true);
create policy "public_update_sets" on set_logs for update using (true);
create policy "public_delete_sets" on set_logs for delete using (true);

drop policy if exists "public_read_meals" on meal_selections;
drop policy if exists "public_write_meals" on meal_selections;
drop policy if exists "public_update_meals" on meal_selections;
create policy "public_read_meals"  on meal_selections for select using (true);
create policy "public_write_meals" on meal_selections for insert with check (true);
create policy "public_update_meals" on meal_selections for update using (true);

drop policy if exists "public_read_cardio" on cardio_logs;
drop policy if exists "public_write_cardio" on cardio_logs;
drop policy if exists "public_update_cardio" on cardio_logs;
create policy "public_read_cardio"  on cardio_logs for select using (true);
create policy "public_write_cardio" on cardio_logs for insert with check (true);
create policy "public_update_cardio" on cardio_logs for update using (true);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='workout_sessions') then
    alter publication supabase_realtime add table workout_sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='set_logs') then
    alter publication supabase_realtime add table set_logs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='meal_selections') then
    alter publication supabase_realtime add table meal_selections;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='cardio_logs') then
    alter publication supabase_realtime add table cardio_logs;
  end if;
end $$;

-- ============================================
-- 2. daily_logs additions
-- ============================================

alter table daily_logs add column if not exists collagen_taken         boolean default false;
alter table daily_logs add column if not exists knee_pain              int check (knee_pain between 0 and 10);
alter table daily_logs add column if not exists single_leg_done        boolean default false;
alter table daily_logs add column if not exists right_leg_rehab_done   boolean default false;

-- ============================================
-- 3. phases metadata
-- ============================================

alter table phases add column if not exists focus_label  text;
alter table phases add column if not exists purpose_text text;

update phases set focus_label = 'Pre-vacation strip',
                  purpose_text = 'Aggressive cut + peak week for Puerto Rico photos.'
  where phase_type = 'cut' and focus_label is null;

update phases set focus_label = 'Stay lean while enjoying',
                  purpose_text = 'Vacation tracking with smart defaults and simple targets.'
  where phase_type = 'vacation' and focus_label is null;

-- ============================================
-- 4. Seed Phase 3 + Phase 4 for Gabby (deactivate previous phases first)
-- ============================================

update phases set is_active = false, updated_at = now() where person = 'gabby';

do $$ begin
  if not exists (select 1 from phases where person='gabby' and name='PRP Recovery + Volleyball Power') then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text)
      values ('gabby', 'PRP Recovery + Volleyball Power', 'recovery_cut',
              '2026-05-12', '2026-06-19', true,
              'Heal + Build + Cut',
              'PRP recovery, volleyball power build, moderate cut toward 135 lbs. Upper body focus weeks 1-5, right leg rehab unlocks week 2.');
  else
    update phases
       set is_active = true, start_date='2026-05-12', end_date='2026-06-19',
           focus_label = 'Heal + Build + Cut',
           purpose_text = 'PRP recovery, volleyball power build, moderate cut toward 135 lbs. Upper body focus weeks 1-5, right leg rehab unlocks week 2.',
           updated_at = now()
     where person='gabby' and name='PRP Recovery + Volleyball Power';
  end if;

  if not exists (select 1 from phases where person='gabby' and name='Tournament Peak') then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text)
      values ('gabby', 'Tournament Peak', 'tournament_peak',
              '2026-06-20', '2026-06-26', false,
              'Peak performance + lean look',
              'Reintegrate lower body and plyometrics, sharpen power, water cut to tournament weight. Tournament: Friday June 26.');
  else
    update phases
       set start_date='2026-06-20', end_date='2026-06-26',
           focus_label = 'Peak performance + lean look',
           purpose_text = 'Reintegrate lower body and plyometrics, sharpen power, water cut to tournament weight. Tournament: Friday June 26.',
           updated_at = now()
     where person='gabby' and name='Tournament Peak';
  end if;
end $$;
