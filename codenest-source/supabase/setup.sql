-- Run this once in the Supabase SQL Editor for the portfolio project.

create table if not exists public.portfolio_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portfolio_content enable row level security;
alter table public.portfolio_admins enable row level security;
revoke all on table public.portfolio_admins from anon, authenticated;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portfolio_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to anon, authenticated;

drop policy if exists "Portfolio content is publicly readable" on public.portfolio_content;
create policy "Portfolio content is publicly readable"
on public.portfolio_content
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated portfolio admins can insert" on public.portfolio_content;
create policy "Authenticated portfolio admins can insert"
on public.portfolio_content
for insert
to authenticated
with check (public.is_portfolio_admin());

drop policy if exists "Authenticated portfolio admins can update" on public.portfolio_content;
create policy "Authenticated portfolio admins can update"
on public.portfolio_content
for update
to authenticated
using (public.is_portfolio_admin())
with check (public.is_portfolio_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-assets',
  'portfolio-assets',
  true,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Portfolio assets are publicly readable" on storage.objects;
create policy "Portfolio assets are publicly readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-assets');

drop policy if exists "Authenticated portfolio admins can upload" on storage.objects;
create policy "Authenticated portfolio admins can upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'portfolio-assets' and public.is_portfolio_admin());

drop policy if exists "Authenticated portfolio admins can update assets" on storage.objects;
create policy "Authenticated portfolio admins can update assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'portfolio-assets' and public.is_portfolio_admin())
with check (bucket_id = 'portfolio-assets' and public.is_portfolio_admin());

drop policy if exists "Authenticated portfolio admins can delete assets" on storage.objects;
create policy "Authenticated portfolio admins can delete assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'portfolio-assets' and public.is_portfolio_admin());
