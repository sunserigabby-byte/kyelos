-- Migration 0002: meal_swaps table for per-component food swaps

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
