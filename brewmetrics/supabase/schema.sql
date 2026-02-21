-- BrewMetrics — Production schema (run in Supabase SQL Editor)
-- Secure, RLS-enabled. Users access only their own data.

-- Profiles (extends auth.users) — one row per user
create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade primary key,
  email text,
  full_name text,
  store_name text,
  branch_id text,
  avatar_url text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read only their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Users can update only their own profile
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

-- Users can read only their own records
create policy "Users can read own roasting_records"
  on public.roasting_records for select
  using (auth.uid() = user_id);

-- Users can insert only with their own user_id
create policy "Users can insert own roasting_records"
  on public.roasting_records for insert
  with check (auth.uid() = user_id);

-- Users can update only their own records
create policy "Users can update own roasting_records"
  on public.roasting_records for update
  using (auth.uid() = user_id);

-- Users can delete only their own records
create policy "Users can delete own roasting_records"
  on public.roasting_records for delete
  using (auth.uid() = user_id);

-- Optional: trigger to create profile on signup (Supabase Auth hook or trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
