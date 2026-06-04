-- Migration 0008: Goals feature — multi-domain phased goal tracker.
-- Three tables: goals (top-level) → goal_phases (ordered sub-phases) → goal_contributions (log).
-- Seeded with the "Financial Recovery & Rebuild" goal (Phases 1–4).
-- Idempotent — safe to re-run.

-- ============================================
-- 1. Tables
-- ============================================

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('financial', 'nutrition', 'fitness', 'other')),
  owner text not null check (owner in ('gabby', 'jon', 'shared')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  status text not null default 'active' check (status in ('active', 'complete', 'paused')),
  start_date date not null,
  target_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists goal_phases (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  phase_number int not null,
  title text not null,
  description text,
  target_value numeric not null default 0,
  current_value numeric not null default 0,
  unit text not null default '$',
  status text not null default 'locked' check (status in ('locked', 'active', 'complete')),
  is_cashflow boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (goal_id, phase_number)
);

create table if not exists goal_contributions (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references goal_phases(id) on delete cascade,
  date date not null default current_date,
  amount numeric not null,
  note text,
  created_by text not null check (created_by in ('gabby', 'jon')),
  created_at timestamptz default now()
);

create index if not exists goals_owner_status_idx       on goals(owner, status);
create index if not exists goal_phases_goal_order_idx   on goal_phases(goal_id, phase_number);
create index if not exists goal_contribs_phase_date_idx on goal_contributions(phase_id, date desc);

-- ============================================
-- 2. RLS — public read/write to match existing app pattern
-- ============================================

alter table goals               enable row level security;
alter table goal_phases         enable row level security;
alter table goal_contributions  enable row level security;

drop policy if exists "public_read_goals"   on goals;
drop policy if exists "public_write_goals"  on goals;
drop policy if exists "public_update_goals" on goals;
drop policy if exists "public_delete_goals" on goals;
create policy "public_read_goals"   on goals for select using (true);
create policy "public_write_goals"  on goals for insert with check (true);
create policy "public_update_goals" on goals for update using (true);
create policy "public_delete_goals" on goals for delete using (true);

drop policy if exists "public_read_goal_phases"   on goal_phases;
drop policy if exists "public_write_goal_phases"  on goal_phases;
drop policy if exists "public_update_goal_phases" on goal_phases;
drop policy if exists "public_delete_goal_phases" on goal_phases;
create policy "public_read_goal_phases"   on goal_phases for select using (true);
create policy "public_write_goal_phases"  on goal_phases for insert with check (true);
create policy "public_update_goal_phases" on goal_phases for update using (true);
create policy "public_delete_goal_phases" on goal_phases for delete using (true);

drop policy if exists "public_read_goal_contribs"   on goal_contributions;
drop policy if exists "public_write_goal_contribs"  on goal_contributions;
drop policy if exists "public_update_goal_contribs" on goal_contributions;
drop policy if exists "public_delete_goal_contribs" on goal_contributions;
create policy "public_read_goal_contribs"   on goal_contributions for select using (true);
create policy "public_write_goal_contribs"  on goal_contributions for insert with check (true);
create policy "public_update_goal_contribs" on goal_contributions for update using (true);
create policy "public_delete_goal_contribs" on goal_contributions for delete using (true);

-- ============================================
-- 3. Realtime
-- ============================================

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='goals') then
    alter publication supabase_realtime add table goals;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='goal_phases') then
    alter publication supabase_realtime add table goal_phases;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='goal_contributions') then
    alter publication supabase_realtime add table goal_contributions;
  end if;
end $$;

-- ============================================
-- 4. Seed "Financial Recovery & Rebuild" (Shared)
-- ============================================

do $$
declare
  v_goal_id uuid;
begin
  select id into v_goal_id
    from goals
   where owner = 'shared' and title = 'Financial Recovery & Rebuild'
   limit 1;

  if v_goal_id is null then
    insert into goals (title, category, owner, priority, status, start_date, target_date, notes)
      values (
        'Financial Recovery & Rebuild',
        'financial', 'shared', 'high', 'active',
        '2026-06-02', '2027-12-31',
        'Recover from jury-duty impersonation scam (~$41k lost). Rebuild own money, finish the emergency fund, repay family for house-fund gift, then build for retirement. Funded by base surplus (~$2,750/mo) + ramping side income (June +$1,600 → July +$2,200 → Aug +$4,000 gross). Pull side-income taxes off FIRST (~$800/mo at full ramp, separate bucket). Net to goal: ~$3,950 → $4,400 → ~$5,950/mo. Any bank-recall recovery applied to Phase 2 first.'
      )
      returning id into v_goal_id;

    insert into goal_phases (goal_id, phase_number, title, description, target_value, current_value, unit, status, is_cashflow) values
      (v_goal_id, 1, 'Emergency / Stabilize',
        'Cover essentials, no savings yet — cash flow not accumulation. Rent, FIT bill (~$1,600 due ~1 wk), basic needs, Gabby''s health appointments. $3k family essentials help received June. Mark complete when essentials reliably covered each month.',
        1, 0, 'status', 'active', true),
      (v_goal_id, 2, 'Rebuild What Was Lost',
        'Restore prior position: business tax reserve (~$5,600), checking buffer (~$6,000), e-fund rebuild to prior ~$9,000. Asset sales (~$1,000) and ANY bank-recall recovery land here first.',
        20500, 0, '$', 'locked', false),
      (v_goal_id, 3, 'Finish E-Fund + Repay Family',
        'Top up e-fund from ~$9k to full $18k (+$9,000). Repay family for house-fund gift + essentials help (~$22,500, amount/pace TBD with Jon''s parents — adjustable, not a hard debt). Lean toward finishing own e-fund first, then family repayment at a humane pace.',
        31500, 0, '$', 'locked', false),
      (v_goal_id, 4, 'Build the Future',
        'Ongoing retirement / long-term savings. No deadline. Funded by the same monthly surplus once Phases 2–3 are done.',
        0, 0, '$', 'locked', false);
  end if;
end $$;
