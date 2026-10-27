create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public) values ('invitation-assets', 'invitation-assets', true) on conflict (id) do nothing;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(), owner_id uuid references auth.users(id) on delete cascade, slug text not null unique, event_type text not null, first_name text not null,
  second_name text, age text, date date not null, time time not null, venue text not null, address text not null default '', maps text,
  message text not null default '', template text not null default 'Elegant Gold', plan text not null default 'starter',
  expires_at timestamptz, views integer not null default 0, cover_photo_url text, gallery_urls jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb, dress_code text, travel_info text, music_url text, created_at timestamptz not null default now()
);

alter table public.invitations add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.invitations add column if not exists cover_photo_url text;
alter table public.invitations add column if not exists gallery_urls jsonb not null default '[]'::jsonb;
alter table public.invitations add column if not exists events jsonb not null default '[]'::jsonb;
alter table public.invitations add column if not exists dress_code text;
alter table public.invitations add column if not exists travel_info text;
alter table public.invitations add column if not exists music_url text;

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(), invitation_id uuid not null references public.invitations(id) on delete cascade,
  name text not null, guest_count integer not null default 1 check (guest_count > 0), response text not null default 'attending', event_name text, message text not null default '', created_at timestamptz not null default now()
);

alter table public.rsvps add column if not exists event_name text;

alter table public.invitations enable row level security;
alter table public.rsvps enable row level security;
revoke all on public.invitations from anon, authenticated;
revoke all on public.rsvps from anon, authenticated;
grant all on public.invitations to service_role;
grant all on public.rsvps to service_role;
