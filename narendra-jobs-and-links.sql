-- Narendra Hero site: Social Links + Job Applications
-- Run this ONCE in Supabase > SQL Editor (safe to run again).

-- 1) Social media buttons (set from Admin > Social Links)
create table if not exists public.site_links (
  key    text primary key,
  label  text not null default '',
  url    text not null default '',
  active boolean not null default false,
  sort   int not null default 100,
  constraint site_links_key_chk   check (key ~ '^[a-z0-9_]{1,20}$'),
  constraint site_links_label_chk check (char_length(label) <= 30),
  constraint site_links_url_chk   check (url = '' or url ~* '^https?://[^[:space:]]+$')
);
alter table public.site_links enable row level security;
drop policy if exists site_links_public_read on public.site_links;
drop policy if exists site_links_staff_all   on public.site_links;
-- visitors can only read buttons that are switched on
create policy site_links_public_read on public.site_links for select to anon using (active and url <> '');
-- logged-in staff can read and change everything
create policy site_links_staff_all on public.site_links for all to authenticated using (true) with check (true);
grant select on public.site_links to anon;
grant select, insert, update, delete on public.site_links to authenticated;

-- 2) Job applications (sent from the Apply for Job form, read in Admin > Job Applications)
create table if not exists public.job_applications (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null,
  father_name text not null,
  mobile      text not null,
  alt_mobile  text not null default '',
  age         int,
  place       text not null default '',
  education   text not null default '',
  applied_for text not null default '',
  experience  text not null default '',
  status      text not null default 'new',
  note        text not null default '',
  constraint job_name_chk   check (char_length(name) between 2 and 60),
  constraint job_father_chk check (char_length(father_name) between 2 and 60),
  constraint job_mobile_chk check (mobile ~ '^[6-9][0-9]{9}$'),
  constraint job_alt_chk    check (alt_mobile = '' or alt_mobile ~ '^[6-9][0-9]{9}$'),
  constraint job_age_chk    check (age is null or age between 14 and 70),
  constraint job_place_chk  check (char_length(place) <= 60),
  constraint job_edu_chk    check (char_length(education) <= 80),
  constraint job_post_chk   check (char_length(applied_for) <= 60),
  constraint job_exp_chk    check (char_length(experience) <= 300),
  constraint job_status_chk check (status in ('new','called','closed')),
  constraint job_note_chk   check (char_length(note) <= 500)
);
alter table public.job_applications enable row level security;
drop policy if exists job_public_insert on public.job_applications;
drop policy if exists job_staff_all     on public.job_applications;
-- visitors can only ADD an application (they can never read any)
create policy job_public_insert on public.job_applications for insert to anon with check (status = 'new' and note = '');
create policy job_staff_all on public.job_applications for all to authenticated using (true) with check (true);
grant insert on public.job_applications to anon;
grant select, insert, update, delete on public.job_applications to authenticated;
