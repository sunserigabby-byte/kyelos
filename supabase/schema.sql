-- Cut Tracker Schema
-- Run this in the Supabase SQL editor

-- Daily check-in logs (weight, waist, sleep, energy, compliance, notes)
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  day_num int not null check (day_num between 1 and 10),
  date date not null,
  weight numeric,
  waist numeric,
  sleep int check (sleep between 1 and 10),
  energy int check (energy between 1 and 10),
  compliance int check (compliance between 1 and 10),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(person, day_num)
);

-- Completion tracking (checkboxes for meals, supps, workout items per day)
create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  day_num int not null check (day_num between 1 and 10),
  item_key text not null,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(person, day_num, item_key)
);

-- Indexes for fast lookups
create index if not exists daily_logs_person_day_idx on daily_logs(person, day_num);
create index if not exists completions_person_day_idx on completions(person, day_num);

-- Enable RLS but allow public access (since this is a simple 2-person app with no auth)
alter table daily_logs enable row level security;
alter table completions enable row level security;

create policy "public_read_logs" on daily_logs for select using (true);
create policy "public_write_logs" on daily_logs for insert with check (true);
create policy "public_update_logs" on daily_logs for update using (true);

create policy "public_read_completions" on completions for select using (true);
create policy "public_write_completions" on completions for insert with check (true);
create policy "public_update_completions" on completions for update using (true);

-- Enable Supabase Realtime so both devices can see live updates
alter publication supabase_realtime add table daily_logs;
alter publication supabase_realtime add table completions;

-- ============================================
-- Cycle tracking (Gabby's profile only — Jon hidden in UI)
-- ============================================

create table if not exists cycle_settings (
  id uuid primary key default gen_random_uuid(),
  person text not null unique check (person in ('gabby', 'jon')),
  last_period_start date not null,
  cycle_length int not null default 28 check (cycle_length between 21 and 45),
  updated_at timestamptz default now()
);

alter table cycle_settings enable row level security;
create policy "public_read_cycle" on cycle_settings for select using (true);
create policy "public_write_cycle" on cycle_settings for insert with check (true);
create policy "public_update_cycle" on cycle_settings for update using (true);
alter publication supabase_realtime add table cycle_settings;

-- Pre-populate Gabby's cycle row
insert into cycle_settings (person, last_period_start, cycle_length)
values ('gabby', '2026-04-02', 33)
on conflict (person) do nothing;

-- ============================================
-- Per-meal food swaps (auto-portioning support)
-- ============================================

create table if not exists meal_swaps (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  day_num int not null check (day_num between 1 and 10),
  meal_key text not null,
  protein_food text,
  protein_serving text,
  carb_food text,
  carb_serving text,
  fat_food text,
  fat_serving text,
  veggie_food text,
  veggie_serving text,
  updated_at timestamptz default now(),
  unique(person, day_num, meal_key)
);

alter table meal_swaps enable row level security;
create policy "public_read_swaps" on meal_swaps for select using (true);
create policy "public_write_swaps" on meal_swaps for insert with check (true);
create policy "public_update_swaps" on meal_swaps for update using (true);
alter publication supabase_realtime add table meal_swaps;

-- ============================================
-- Water + steps on daily_logs
-- ============================================

alter table daily_logs add column if not exists water_oz int default 0;
alter table daily_logs add column if not exists steps int;

-- ============================================
-- Notification settings (per-person reminder toggles)
-- ============================================

create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  person text not null unique check (person in ('gabby', 'jon')),
  wake_supps boolean default true,
  am_cardio boolean default true,
  tea_2pm boolean default true,
  pm_workout boolean default true,
  wind_down boolean default true,
  partner_cardio boolean default true,
  partner_workout boolean default true,
  partner_meals boolean default false,
  partner_supps boolean default false,
  updated_at timestamptz default now()
);

alter table notification_settings enable row level security;
create policy "public_read_notif" on notification_settings for select using (true);
create policy "public_write_notif" on notification_settings for insert with check (true);
create policy "public_update_notif" on notification_settings for update using (true);
alter publication supabase_realtime add table notification_settings;

insert into notification_settings (person) values ('gabby') on conflict (person) do nothing;
insert into notification_settings (person) values ('jon')   on conflict (person) do nothing;

-- ============================================
-- Partner accountability nudges
-- ============================================

create table if not exists partner_nudges (
  id uuid primary key default gen_random_uuid(),
  from_person text not null,
  to_person text not null,
  nudge_type text not null check (nudge_type in ('cardio', 'workout', 'meals', 'supps')),
  day_num int not null,
  message text not null,
  created_at timestamptz default now(),
  shown boolean default false,
  unique(from_person, to_person, nudge_type, day_num)
);

alter table partner_nudges enable row level security;
create policy "public_read_nudge" on partner_nudges for select using (true);
create policy "public_write_nudge" on partner_nudges for insert with check (true);
create policy "public_update_nudge" on partner_nudges for update using (true);
alter publication supabase_realtime add table partner_nudges;

-- ============================================
-- Phase system (Phase 2: PR Vacation onward)
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
create policy "public_read_phases"  on phases for select using (true);
create policy "public_write_phases" on phases for insert with check (true);
create policy "public_update_phases" on phases for update using (true);
alter publication supabase_realtime add table phases;

insert into phases (person, name, phase_type, start_date, end_date, is_active) values
  ('gabby', '10-Day Cut Protocol', 'cut',      '2026-04-23', '2026-05-02', false),
  ('gabby', 'Puerto Rico Vacation', 'vacation', '2026-05-02', '2026-05-09', true),
  ('jon',   '10-Day Cut Protocol', 'cut',      '2026-04-23', '2026-05-02', false),
  ('jon',   'Puerto Rico Vacation', 'vacation', '2026-05-02', '2026-05-09', true);

alter table daily_logs  add column if not exists phase_id        uuid references phases(id);
alter table daily_logs  add column if not exists diet_sodas      int default 0;
alter table daily_logs  add column if not exists recovery_mode   boolean default false;
alter table daily_logs  add column if not exists protein_g       int default 0;
alter table daily_logs  add column if not exists dandelion_count int default 0;
alter table completions add column if not exists phase_id        uuid references phases(id);

-- Note: unique constraints on daily_logs and completions are extended in
-- migration 0004 to include phase_id, after backfilling existing rows.
