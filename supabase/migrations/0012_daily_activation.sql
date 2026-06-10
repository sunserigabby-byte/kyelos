-- Migration 0012: daily VMO + glute activation streak tracking.
-- Idempotent.

alter table daily_logs add column if not exists daily_activation_done boolean default false;
