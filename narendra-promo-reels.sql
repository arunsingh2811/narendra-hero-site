-- Narendra Hero site: Promo Reels (a picture of a reel under the social buttons, with links to watch it)
-- Run this ONCE in Supabase > SQL Editor (safe to run again).
create table if not exists public.promo_reels (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  title      text not null default '',
  images     text[] not null default '{}',
  fb_url     text not null default '',
  ig_url     text not null default '',
  yt_url     text not null default '',
  sort       int  not null default 100,
  active     boolean not null default true,
  constraint promo_title_chk check (char_length(title) <= 120),
  constraint promo_fb_chk check (fb_url = '' or fb_url ~* '^https?://[^[:space:]]+$'),
  constraint promo_ig_chk check (ig_url = '' or ig_url ~* '^https?://[^[:space:]]+$'),
  constraint promo_yt_chk check (yt_url = '' or yt_url ~* '^https?://[^[:space:]]+$')
);
alter table public.promo_reels enable row level security;
drop policy if exists promo_public_read on public.promo_reels;
drop policy if exists promo_staff_all   on public.promo_reels;
-- visitors can only read reels that are switched on
create policy promo_public_read on public.promo_reels for select to anon using (active);
-- logged-in staff can read and change everything
create policy promo_staff_all on public.promo_reels for all to authenticated using (true) with check (true);
grant select on public.promo_reels to anon;
grant select, insert, update, delete on public.promo_reels to authenticated;
