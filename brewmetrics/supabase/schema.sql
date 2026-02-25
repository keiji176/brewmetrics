-- BrewMetrics — Production schema (run in Supabase SQL Editor)
-- Secure, RLS-enabled. Users access only their own data.
-- If profiles already exists, add language: alter table public.profiles add column if not exists language text default 'en';

-- Profiles (extends auth.users) — one row per user
create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade primary key,
  email text,
  full_name text,
  store_name text,
  branch_id text,
  avatar_url text,
  language text default 'en' check (language in ('en', 'ja')),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Roasting records — user-scoped CRUD
create table if not exists public.roasting_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade not null,
  bean_name text,
  roast_temperature numeric,
  roast_time numeric,
  grind_size text,
  extraction_time numeric,
  cupping_score numeric,
  created_at timestamptz default now()
);

alter table public.roasting_records enable row level security;

drop policy if exists "Users can read own roasting_records" on public.roasting_records;
create policy "Users can read own roasting_records"
  on public.roasting_records for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own roasting_records" on public.roasting_records;
create policy "Users can insert own roasting_records"
  on public.roasting_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own roasting_records" on public.roasting_records;
create policy "Users can update own roasting_records"
  on public.roasting_records for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own roasting_records" on public.roasting_records;
create policy "Users can delete own roasting_records"
  on public.roasting_records for delete
  using (auth.uid() = user_id);

-- Optional: trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, language)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'en'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bean profiles
create table if not exists public.bean_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade not null,
  bean_name text,
  variety text,
  roaster text,
  origin text,
  roast_level text,
  process text,
  created_at timestamptz default now() not null
);

alter table public.bean_profiles add column if not exists variety text;
alter table public.bean_profiles enable row level security;

drop policy if exists "Users can read own bean_profiles" on public.bean_profiles;
create policy "Users can read own bean_profiles"
  on public.bean_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own bean_profiles" on public.bean_profiles;
create policy "Users can insert own bean_profiles"
  on public.bean_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bean_profiles" on public.bean_profiles;
create policy "Users can update own bean_profiles"
  on public.bean_profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own bean_profiles" on public.bean_profiles;
create policy "Users can delete own bean_profiles"
  on public.bean_profiles for delete
  using (auth.uid() = user_id);

create index if not exists bean_profiles_user_id_created_at_idx
  on public.bean_profiles (user_id, created_at desc);

-- Brew records
create table if not exists public.brew_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade not null,
  bean_name text,
  variety text,
  roaster text,
  grind_size text,
  temperature numeric,
  coffee_weight numeric,
  water_weight numeric,
  brew_time numeric,
  score numeric,
  notes text,
  created_at timestamptz default now() not null
);

alter table public.brew_records add column if not exists variety text;
alter table public.brew_records enable row level security;

drop policy if exists "Users can read own brew_records" on public.brew_records;
create policy "Users can read own brew_records"
  on public.brew_records for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own brew_records" on public.brew_records;
create policy "Users can insert own brew_records"
  on public.brew_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own brew_records" on public.brew_records;
create policy "Users can update own brew_records"
  on public.brew_records for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own brew_records" on public.brew_records;
create policy "Users can delete own brew_records"
  on public.brew_records for delete
  using (auth.uid() = user_id);

create index if not exists brew_records_user_id_created_at_idx
  on public.brew_records (user_id, created_at desc);

-- Grinder calibration
create table if not exists public.grinder_calibrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade not null,
  grinder_name text not null,
  fine_click integer not null,
  medium_fine_click integer not null,
  medium_click integer not null,
  medium_coarse_click integer not null,
  coarse_click integer not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.grinder_calibrations enable row level security;

drop policy if exists "Users can read own grinder_calibrations" on public.grinder_calibrations;
create policy "Users can read own grinder_calibrations"
  on public.grinder_calibrations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own grinder_calibrations" on public.grinder_calibrations;
create policy "Users can insert own grinder_calibrations"
  on public.grinder_calibrations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own grinder_calibrations" on public.grinder_calibrations;
create policy "Users can update own grinder_calibrations"
  on public.grinder_calibrations for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own grinder_calibrations" on public.grinder_calibrations;
create policy "Users can delete own grinder_calibrations"
  on public.grinder_calibrations for delete
  using (auth.uid() = user_id);

create index if not exists grinder_calibrations_user_id_idx
  on public.grinder_calibrations (user_id, created_at desc);

-- User gears
create table if not exists public.user_gears (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade not null,
  gear_id text not null,
  created_at timestamptz default now() not null,
  unique (user_id, gear_id)
);

alter table public.user_gears enable row level security;

drop policy if exists "Users can read own user_gears" on public.user_gears;
create policy "Users can read own user_gears"
  on public.user_gears for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own user_gears" on public.user_gears;
create policy "Users can insert own user_gears"
  on public.user_gears for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own user_gears" on public.user_gears;
create policy "Users can update own user_gears"
  on public.user_gears for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own user_gears" on public.user_gears;
create policy "Users can delete own user_gears"
  on public.user_gears for delete
  using (auth.uid() = user_id);

create index if not exists user_gears_user_id_idx
  on public.user_gears (user_id, created_at desc);

-- User custom gears
create table if not exists public.user_custom_gears (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users (id) on delete cascade not null,
  category text not null,
  gear_name text not null,
  created_at timestamptz default now() not null
);

alter table public.user_custom_gears enable row level security;

drop policy if exists "Users can read own user_custom_gears" on public.user_custom_gears;
create policy "Users can read own user_custom_gears"
  on public.user_custom_gears for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own user_custom_gears" on public.user_custom_gears;
create policy "Users can insert own user_custom_gears"
  on public.user_custom_gears for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own user_custom_gears" on public.user_custom_gears;
create policy "Users can update own user_custom_gears"
  on public.user_custom_gears for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own user_custom_gears" on public.user_custom_gears;
create policy "Users can delete own user_custom_gears"
  on public.user_custom_gears for delete
  using (auth.uid() = user_id);

create index if not exists user_custom_gears_user_id_idx
  on public.user_custom_gears (user_id, created_at desc);