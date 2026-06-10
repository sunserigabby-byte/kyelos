-- Migration 0011: Six-phase training plan + jump/strength tracking + milestones.
-- Close current active phase, deploy Phase A–F (Jun 9 → Dec 13, 2026).
-- Idempotent — safe to re-run.

-- ============================================
-- 1. Phases additions
-- ============================================

alter table phases add column if not exists status text default 'active';
alter table phases add column if not exists completed_at timestamptz;
alter table phases add column if not exists code text;

create unique index if not exists phases_code_unique_idx on phases (person, code) where code is not null;

-- ============================================
-- 2. Daily-log additions
-- ============================================

alter table daily_logs add column if not exists hmb_taken boolean default false;

-- ============================================
-- 3. New tables
-- ============================================

create table if not exists vertical_jump_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  logged_at timestamptz not null default now(),
  standing_reach_inches numeric(5,2),
  standing_vertical_inches numeric(5,2),
  approach_vertical_inches numeric(5,2),
  max_touch_inches numeric(5,2),
  cmj_cm numeric(5,2),
  measurement_method text,
  notes text,
  phase_id text
);
create index if not exists vertical_jump_logs_user_logged_idx on vertical_jump_logs (user_id, logged_at desc);

create table if not exists strength_prs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  logged_at timestamptz not null default now(),
  lift_name text not null,
  weight_lbs numeric(6,2),
  reps int,
  estimated_1rm_lbs numeric(6,2),
  phase_id text,
  notes text
);
create index if not exists strength_prs_user_lift_idx on strength_prs (user_id, lift_name, logged_at desc);

create table if not exists scheduled_tests (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  phase_id text not null,
  scheduled_date date not null,
  test_type text not null,
  test_label text not null,
  target_value text,
  completed boolean default false,
  completed_at timestamptz,
  notes text
);
create index if not exists scheduled_tests_user_date_idx on scheduled_tests (user_id, scheduled_date);

create table if not exists phase_milestones (
  id uuid primary key default gen_random_uuid(),
  phase_id text not null,
  metric text not null,
  target_value numeric(6,2),
  target_unit text,
  notes text
);
create index if not exists phase_milestones_phase_idx on phase_milestones (phase_id);

-- RLS
alter table vertical_jump_logs enable row level security;
alter table strength_prs       enable row level security;
alter table scheduled_tests    enable row level security;
alter table phase_milestones   enable row level security;

drop policy if exists "public_all" on vertical_jump_logs;
drop policy if exists "public_all" on strength_prs;
drop policy if exists "public_all" on scheduled_tests;
drop policy if exists "public_all" on phase_milestones;
create policy "public_all" on vertical_jump_logs for all using (true) with check (true);
create policy "public_all" on strength_prs       for all using (true) with check (true);
create policy "public_all" on scheduled_tests    for all using (true) with check (true);
create policy "public_all" on phase_milestones   for all using (true) with check (true);

-- Realtime
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='vertical_jump_logs') then
    alter publication supabase_realtime add table vertical_jump_logs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='strength_prs') then
    alter publication supabase_realtime add table strength_prs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='scheduled_tests') then
    alter publication supabase_realtime add table scheduled_tests;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='phase_milestones') then
    alter publication supabase_realtime add table phase_milestones;
  end if;
end $$;

-- ============================================
-- 4. Close all currently-active phases for Gabby
-- ============================================

update phases
   set is_active = false,
       status = 'completed',
       completed_at = coalesce(completed_at, now()),
       updated_at = now()
 where person = 'gabby' and is_active = true;

-- Backfill: anything still "active" status but inactive flag becomes "completed".
update phases
   set status = 'completed'
 where status = 'active' and is_active = false;

-- ============================================
-- 5. Insert six new phases (Phase A–F) for Gabby
-- ============================================

do $$
declare
  v_pa uuid;
  v_pb uuid;
  v_pc uuid;
  v_pd uuid;
  v_pe uuid;
  v_pf uuid;
begin
  -- Phase A — Pottstown Rebuild (active today)
  select id into v_pa from phases where person='gabby' and code='phase_a';
  if v_pa is null then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text, status, code)
      values ('gabby', 'Pottstown Rebuild', 'training_plan',
              '2026-06-09', '2026-06-28', true,
              'Rebuild',
              'Restore lower-body muscle lost during PRP. Slight deficit, heavy bilateral lifting returns, peak for Pottstown.',
              'active', 'phase_a')
      returning id into v_pa;
  else
    update phases set is_active=true, status='active', updated_at=now() where id=v_pa;
  end if;

  -- Phase B — Muscle Build A
  select id into v_pb from phases where person='gabby' and code='phase_b';
  if v_pb is null then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text, status, code)
      values ('gabby', 'Muscle Build A', 'training_plan',
              '2026-06-29', '2026-07-26', false,
              'Build',
              'Pure muscle building. Light surplus on training days. Plyo reintegrates. First vertical test mid-phase.',
              'active', 'phase_b')
      returning id into v_pb;
  end if;

  -- Phase C — Muscle Build B
  select id into v_pc from phases where person='gabby' and code='phase_c';
  if v_pc is null then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text, status, code)
      values ('gabby', 'Muscle Build B', 'training_plan',
              '2026-07-27', '2026-08-23', false,
              'Strength',
              'Push past pre-injury baselines. Depth jumps, approach jumps with full 4-step. Career best vertical territory by end.',
              'active', 'phase_c')
      returning id into v_pc;
  end if;

  -- Phase D — Power Development
  select id into v_pd from phases where person='gabby' and code='phase_d';
  if v_pd is null then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text, status, code)
      values ('gabby', 'Power Development', 'training_plan',
              '2026-08-24', '2026-09-20', false,
              'Power',
              'Max strength + reactive plyometrics. Maintenance calories. THE block where vertical PRs happen.',
              'active', 'phase_d')
      returning id into v_pd;
  end if;

  -- Phase E — Polish
  select id into v_pe from phases where person='gabby' and code='phase_e';
  if v_pe is null then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text, status, code)
      values ('gabby', 'Polish', 'training_plan',
              '2026-09-21', '2026-10-18', false,
              'Hold',
              'Maintain strength and vertical gains. Light deficit to begin dropping body fat.',
              'active', 'phase_e')
      returning id into v_pe;
  end if;

  -- Phase F — Final Cut to 18%
  select id into v_pf from phases where person='gabby' and code='phase_f';
  if v_pf is null then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text, status, code)
      values ('gabby', 'Final Cut to 18%', 'training_plan',
              '2026-10-19', '2026-12-13', false,
              'Cut',
              'Targeted fat loss to land at 128 / 18% / 99 muscle. Heavy intensity preserved, volume reduced.',
              'active', 'phase_f')
      returning id into v_pf;
  end if;
end $$;

-- ============================================
-- 6. Seed phase_milestones (idempotent by phase_id + metric)
-- ============================================

insert into phase_milestones (phase_id, metric, target_value, target_unit)
select * from (values
  ('phase_a', 'weight', 128, 'lbs'),
  ('phase_a', 'body_fat_pct', 22, '%'),
  ('phase_a', 'muscle_mass', 96, 'lbs'),

  ('phase_b', 'weight', 132, 'lbs'),
  ('phase_b', 'body_fat_pct', 21, '%'),
  ('phase_b', 'muscle_mass', 98, 'lbs'),
  ('phase_b', 'standing_vertical', 20, 'inches'),
  ('phase_b', 'approach_vertical', 25, 'inches'),
  ('phase_b', 'cmj', 28, 'cm'),

  ('phase_c', 'weight', 133, 'lbs'),
  ('phase_c', 'body_fat_pct', 20, '%'),
  ('phase_c', 'muscle_mass', 99, 'lbs'),
  ('phase_c', 'standing_vertical', 22, 'inches'),
  ('phase_c', 'approach_vertical', 27, 'inches'),
  ('phase_c', 'cmj', 30, 'cm'),
  ('phase_c', 'squat_1rm', 165, 'lbs'),

  ('phase_d', 'weight', 133, 'lbs'),
  ('phase_d', 'body_fat_pct', 19, '%'),
  ('phase_d', 'muscle_mass', 100, 'lbs'),
  ('phase_d', 'standing_vertical', 24, 'inches'),
  ('phase_d', 'approach_vertical', 29, 'inches'),
  ('phase_d', 'cmj', 35, 'cm'),
  ('phase_d', 'squat_1rm', 185, 'lbs'),

  ('phase_e', 'weight', 131, 'lbs'),
  ('phase_e', 'body_fat_pct', 19, '%'),
  ('phase_e', 'muscle_mass', 100, 'lbs'),

  ('phase_f', 'weight', 128, 'lbs'),
  ('phase_f', 'body_fat_pct', 18, '%'),
  ('phase_f', 'muscle_mass', 99, 'lbs'),
  ('phase_f', 'approach_vertical', 29, 'inches')
) as v(phase_id, metric, target_value, target_unit)
where not exists (
  select 1 from phase_milestones pm
   where pm.phase_id = v.phase_id and pm.metric = v.metric
);

-- ============================================
-- 7. Seed scheduled_tests (idempotent by user + phase + date + label)
-- ============================================

insert into scheduled_tests (user_id, phase_id, scheduled_date, test_type, test_label, target_value)
select * from (values
  -- Phase A
  ('gabby', 'phase_a', date '2026-06-15', 'body_comp', 'Week 1 Renpho check', '129-131 lbs / 22-23% BF'),
  ('gabby', 'phase_a', date '2026-06-22', 'body_comp', 'Week 2 Renpho check', '130-132 lbs / 22% BF'),
  ('gabby', 'phase_a', date '2026-06-26', 'photo',     'Pre-tournament photos', 'Front/side/back at ~129 lbs'),
  ('gabby', 'phase_a', date '2026-06-28', 'body_comp', 'Post-tournament check-in', 'End of Phase A baseline'),

  -- Phase B
  ('gabby', 'phase_b', date '2026-07-05', 'body_comp', 'Week 1 of build', 'Weight stable or up 1 lb'),
  ('gabby', 'phase_b', date '2026-07-12', 'body_comp', 'Week 2 of build', '131-132 lbs'),
  ('gabby', 'phase_b', date '2026-07-15', 'vertical',  'FIRST vertical test (standing only)', 'Standing wall touch — get baseline'),
  ('gabby', 'phase_b', date '2026-07-19', 'body_comp', 'Week 3 + photos', '131-133 lbs, photos'),
  ('gabby', 'phase_b', date '2026-07-22', 'vertical',  'Approach vertical test', 'Target 24-25"'),
  ('gabby', 'phase_b', date '2026-07-25', 'strength_pr','Squat 5RM test', 'Find current 5RM, compare to pre-PRP'),
  ('gabby', 'phase_b', date '2026-07-26', 'body_comp', 'End of Phase B', 'Target: 132 / 21% / 98 muscle'),

  -- Phase C
  ('gabby', 'phase_c', date '2026-08-05', 'vertical',   'Approach vertical', 'Target 25"'),
  ('gabby', 'phase_c', date '2026-08-12', 'vertical',   'Approach vertical', 'Target 26"'),
  ('gabby', 'phase_c', date '2026-08-15', 'cmj',        'Force plate CMJ test', 'Target 28-30 cm'),
  ('gabby', 'phase_c', date '2026-08-19', 'vertical',   'Approach vertical', 'Target 26-27"'),
  ('gabby', 'phase_c', date '2026-08-20', 'strength_pr','Deadlift 3RM test', 'Find current 3RM'),
  ('gabby', 'phase_c', date '2026-08-22', 'photo',      'Mid-cycle photos', 'Front/side/back'),
  ('gabby', 'phase_c', date '2026-08-23', 'body_comp',  'End of Phase C', 'Target: 133 / 20% / 99 muscle'),

  -- Phase D
  ('gabby', 'phase_d', date '2026-08-31', 'vertical',   'Approach vertical', 'Target 27-28"'),
  ('gabby', 'phase_d', date '2026-09-07', 'vertical',   'Approach vertical', 'Target 28"'),
  ('gabby', 'phase_d', date '2026-09-14', 'vertical',   'Approach vertical', 'Target 28-29"'),
  ('gabby', 'phase_d', date '2026-09-17', 'cmj',        'CMJ test', 'Target 33-35 cm'),
  ('gabby', 'phase_d', date '2026-09-19', 'strength_pr','Squat + Deadlift 1RM test', 'Peak strength test'),
  ('gabby', 'phase_d', date '2026-09-20', 'vertical',   'PR attempt — approach vertical', 'GOAL: 29-30"'),
  ('gabby', 'phase_d', date '2026-09-20', 'body_comp',  'End of Phase D', 'Target: 133 / 19% / 100 muscle'),

  -- Phase E
  ('gabby', 'phase_e', date '2026-10-05', 'body_comp',  'Mid-cut check', '131 / 19%'),
  ('gabby', 'phase_e', date '2026-10-15', 'vertical',   'Hold-check vertical', 'Maintain 28-29"'),
  ('gabby', 'phase_e', date '2026-10-18', 'body_comp',  'End of Phase E', 'Target: 131 / 19% / 100 muscle'),

  -- Phase F
  ('gabby', 'phase_f', date '2026-11-01', 'body_comp',  'Cut Week 2', '130 / 18.5%'),
  ('gabby', 'phase_f', date '2026-11-15', 'body_comp',  'Cut Week 4 + photos', '129 / 18%'),
  ('gabby', 'phase_f', date '2026-11-29', 'body_comp',  'Cut Week 6', '128.5 / 18%'),
  ('gabby', 'phase_f', date '2026-12-10', 'vertical',   'Final vertical check', 'Maintain 28-30"'),
  ('gabby', 'phase_f', date '2026-12-13', 'body_comp',  '🎯 GOAL CHECK', '128 / 18% / 99 muscle'),
  ('gabby', 'phase_f', date '2026-12-13', 'photo',      'Goal achievement photos', 'Final transformation set')
) as v(user_id, phase_id, scheduled_date, test_type, test_label, target_value)
where not exists (
  select 1 from scheduled_tests t
   where t.user_id = v.user_id
     and t.phase_id = v.phase_id
     and t.scheduled_date = v.scheduled_date
     and t.test_label = v.test_label
);

-- ============================================
-- 8. Seed historical vertical jump data
-- ============================================

insert into vertical_jump_logs (user_id, logged_at, standing_reach_inches, standing_vertical_inches, approach_vertical_inches, max_touch_inches, measurement_method, notes)
select 'gabby', timestamp '2026-01-22', 82.5, 20.5, 25.0, 107.5, 'Wall touch', 'Pre-PRP baseline'
where not exists (
  select 1 from vertical_jump_logs v
   where v.user_id='gabby' and v.notes='Pre-PRP baseline'
);

insert into vertical_jump_logs (user_id, logged_at, cmj_cm, measurement_method, notes)
select 'gabby', timestamp '2025-09-15', 30.7, 'Force plate', 'Pre-concussion peak CMJ 30.7cm — career best'
where not exists (
  select 1 from vertical_jump_logs v
   where v.user_id='gabby' and v.notes ilike 'Pre-concussion peak CMJ%'
);
