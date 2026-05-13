-- Migration 0007: superset columns on set_logs + revert Phase 3 start to May 12
-- (May 12 is now Day 1 = injection-day rest, in-plan but no workout.)
-- Idempotent — safe to re-run.

-- ============================================
-- 1. Add superset metadata to set_logs
-- ============================================

alter table set_logs add column if not exists superset_group text;
alter table set_logs add column if not exists exercise_order int;

-- ============================================
-- 2. Revert Phase 3 start_date back to May 12 for both profiles
-- ============================================

update phases
   set start_date = '2026-05-12', updated_at = now()
 where person = 'gabby'
   and name = 'PRP Recovery + Volleyball Power';

update phases
   set start_date = '2026-05-12', updated_at = now()
 where person = 'jon'
   and name = 'Cut to 160';
