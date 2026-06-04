-- Migration 0010: Phase checklist items + weekly contribution target +
-- weekly transfer notification setting.
-- Idempotent — safe to re-run.

-- ============================================
-- 1. Checklist items per phase
-- ============================================

create table if not exists goal_phase_checklist_items (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references goal_phases(id) on delete cascade,
  sort_order int not null default 0,
  label text not null,
  checked boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists goal_phase_checklist_phase_idx
  on goal_phase_checklist_items(phase_id, sort_order);

alter table goal_phase_checklist_items enable row level security;

drop policy if exists "public_read_phase_checklist"   on goal_phase_checklist_items;
drop policy if exists "public_write_phase_checklist"  on goal_phase_checklist_items;
drop policy if exists "public_update_phase_checklist" on goal_phase_checklist_items;
drop policy if exists "public_delete_phase_checklist" on goal_phase_checklist_items;
create policy "public_read_phase_checklist"   on goal_phase_checklist_items for select using (true);
create policy "public_write_phase_checklist"  on goal_phase_checklist_items for insert with check (true);
create policy "public_update_phase_checklist" on goal_phase_checklist_items for update using (true);
create policy "public_delete_phase_checklist" on goal_phase_checklist_items for delete using (true);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='goal_phase_checklist_items') then
    alter publication supabase_realtime add table goal_phase_checklist_items;
  end if;
end $$;

-- ============================================
-- 2. Monthly contribution target on phases (nullable)
-- ============================================

alter table goal_phases
  add column if not exists monthly_contribution_target numeric;

-- ============================================
-- 3. Weekly transfer notification key
-- ============================================

alter table notification_settings
  add column if not exists weekly_transfer boolean default false;

alter table notification_settings
  add column if not exists weekly_transfer_day  int default 1   check (weekly_transfer_day between 0 and 6);

alter table notification_settings
  add column if not exists weekly_transfer_hour int default 9   check (weekly_transfer_hour between 0 and 23);

-- ============================================
-- 4. Seed Phase 1 quick-start checklist (only if Phase 1 has no items yet)
-- ============================================

do $$
declare
  v_phase_id uuid;
begin
  select p.id into v_phase_id
    from goal_phases p
    join goals g on g.id = p.goal_id
   where g.owner = 'shared'
     and g.title = 'Financial Recovery & Rebuild'
     and p.phase_number = 1
   limit 1;

  if v_phase_id is not null
     and not exists (select 1 from goal_phase_checklist_items where phase_id = v_phase_id) then
    insert into goal_phase_checklist_items (phase_id, sort_order, label) values
      (v_phase_id, 1, 'Track 2 weeks of real spending to confirm surplus'),
      (v_phase_id, 2, 'List unused items for sale'),
      (v_phase_id, 3, 'Open / designate separate savings account (sub-accounts per phase if bank allows)'),
      (v_phase_id, 4, 'Set first weekly auto-transfer (~$625–750)'),
      (v_phase_id, 5, 'Confirm Blueprint tax-reserve %'),
      (v_phase_id, 6, 'Pick weekly money + feelings check-in day'),
      (v_phase_id, 7, 'Pay FIT Carrboro bill (~$1,600) — log as Blueprint business expense'),
      (v_phase_id, 8, 'Cover rent, basic needs, utilities, gas for the month'),
      (v_phase_id, 9, 'Schedule Gabby''s health appointments');
  end if;
end $$;

-- ============================================
-- 5. Seed monthly contribution target for Phase 2 (Rebuild) — $3,000/mo
--    from the spec's MONTHLY ALLOCATION section.
-- ============================================

update goal_phases
   set monthly_contribution_target = 3000
 where monthly_contribution_target is null
   and phase_number = 2
   and goal_id in (
     select id from goals
      where owner = 'shared' and title = 'Financial Recovery & Rebuild'
   );

update goal_phases
   set monthly_contribution_target = 3000
 where monthly_contribution_target is null
   and phase_number = 3
   and goal_id in (
     select id from goals
      where owner = 'shared' and title = 'Financial Recovery & Rebuild'
   );
