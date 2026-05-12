-- Migration 0006: Jon's Phase 3 (sustained cut) + treat_logs table.
-- Idempotent — safe to re-run.

-- ============================================
-- treat_logs table
-- ============================================

create table if not exists treat_logs (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('gabby', 'jon')),
  phase_id uuid references phases(id),
  logged_date date not null,
  week_num int not null,
  treat_name text not null,
  estimated_calories int not null,
  category text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists treat_logs_lookup_idx on treat_logs(person, phase_id, week_num);

alter table treat_logs enable row level security;

drop policy if exists "public_read_treats" on treat_logs;
drop policy if exists "public_write_treats" on treat_logs;
drop policy if exists "public_delete_treats" on treat_logs;
create policy "public_read_treats"   on treat_logs for select using (true);
create policy "public_write_treats"  on treat_logs for insert with check (true);
create policy "public_delete_treats" on treat_logs for delete using (true);

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='treat_logs') then
    alter publication supabase_realtime add table treat_logs;
  end if;
end $$;

-- ============================================
-- Jon's Phase 3 (sustained_cut, May 12 - Jun 26)
-- Deactivate any prior Jon phases first.
-- ============================================

update phases set is_active = false, updated_at = now() where person = 'jon';

do $$ begin
  if not exists (select 1 from phases where person='jon' and name='Cut to 160') then
    insert into phases (person, name, phase_type, start_date, end_date, is_active, focus_label, purpose_text)
      values ('jon', 'Cut to 160', 'sustained_cut',
              '2026-05-12', '2026-06-26', true,
              'Lean and strong',
              'Cut from 173 → 160 lb at ~1.75 lbs/week while maintaining strength on personal training program. 1,900 cal target with 1,000 cal weekly treat budget.');
  else
    update phases
       set is_active = true,
           start_date = '2026-05-12',
           end_date = '2026-06-26',
           focus_label = 'Lean and strong',
           purpose_text = 'Cut from 173 → 160 lb at ~1.75 lbs/week while maintaining strength on personal training program. 1,900 cal target with 1,000 cal weekly treat budget.',
           updated_at = now()
     where person='jon' and name='Cut to 160';
  end if;
end $$;
