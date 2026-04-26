-- Migration 0001: cycle_settings table for cycle tracking (Gabby's profile)

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

-- Pre-populate Gabby's row
insert into cycle_settings (person, last_period_start, cycle_length)
values ('gabby', '2026-04-02', 33)
on conflict (person) do nothing;
