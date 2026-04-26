-- Migration 0003: Phase 4 features
-- Includes meal_swaps (missed from earlier migration), water + steps,
-- notifications, partner nudges. Idempotent — safe to re-run.

-- ============================================
-- meal_swaps (was skipped in migration 0002 due to upstream policy conflict)
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

drop policy if exists "public_read_swaps" on meal_swaps;
drop policy if exists "public_write_swaps" on meal_swaps;
drop policy if exists "public_update_swaps" on meal_swaps;
create policy "public_read_swaps" on meal_swaps for select using (true);
create policy "public_write_swaps" on meal_swaps for insert with check (true);
create policy "public_update_swaps" on meal_swaps for update using (true);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='meal_swaps') then
    alter publication supabase_realtime add table meal_swaps;
  end if;
end $$;

-- ============================================
-- Water + steps on daily_logs
-- ============================================

alter table daily_logs add column if not exists water_oz int default 0;
alter table daily_logs add column if not exists steps int;

-- ============================================
-- notification_settings
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

drop policy if exists "public_read_notif" on notification_settings;
drop policy if exists "public_write_notif" on notification_settings;
drop policy if exists "public_update_notif" on notification_settings;
create policy "public_read_notif" on notification_settings for select using (true);
create policy "public_write_notif" on notification_settings for insert with check (true);
create policy "public_update_notif" on notification_settings for update using (true);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='notification_settings') then
    alter publication supabase_realtime add table notification_settings;
  end if;
end $$;

-- Seed default rows for both people (idempotent)
insert into notification_settings (person) values ('gabby') on conflict (person) do nothing;
insert into notification_settings (person) values ('jon')   on conflict (person) do nothing;

-- ============================================
-- partner_nudges
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

drop policy if exists "public_read_nudge" on partner_nudges;
drop policy if exists "public_write_nudge" on partner_nudges;
drop policy if exists "public_update_nudge" on partner_nudges;
create policy "public_read_nudge" on partner_nudges for select using (true);
create policy "public_write_nudge" on partner_nudges for insert with check (true);
create policy "public_update_nudge" on partner_nudges for update using (true);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='partner_nudges') then
    alter publication supabase_realtime add table partner_nudges;
  end if;
end $$;
