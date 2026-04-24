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
