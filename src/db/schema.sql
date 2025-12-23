-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Public user data)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. VIDEOS (Content)
create type video_status as enum ('pending', 'approved', 'banned');

create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text, -- optional, can be generated or separate
  status video_status default 'pending', -- Default to pending for moderation
  downloads_count bigint default 0,
  likes_count bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.videos enable row level security;

-- Videos Policies
create policy "Approved videos are viewable by everyone"
  on public.videos for select
  using ( status = 'approved' );

create policy "Users can see their own videos regardless of status"
  on public.videos for select
  using ( auth.uid() = user_id );

create policy "Admins can see all videos"
  on public.videos for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

create policy "Users can upload videos"
  on public.videos for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own videos"
  on public.videos for delete
  using ( auth.uid() = user_id );

-- 3. LIKES (Interactions)
create table public.likes (
  user_id uuid references public.profiles(id) not null,
  video_id uuid references public.videos(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, video_id)
);

-- Enable RLS
alter table public.likes enable row level security;

-- Likes Policies
create policy "Likes are viewable by everyone"
  on public.likes for select
  using ( true );

create policy "Authenticated users can like videos"
  on public.likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can unlike videos"
  on public.likes for delete
  using ( auth.uid() = user_id );

-- 4. REPORTS (Moderation)
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id) not null,
  video_id uuid references public.videos(id) not null,
  reason text not null,
  resolved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reports enable row level security;

-- Reports Policies
create policy "Admins can view reports"
  on public.reports for select
  using ( exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) );

create policy "Authenticated users can submit reports"
  on public.reports for insert
  with check ( auth.uid() = reporter_id );

-- FUNCTIONS & TRIGGERS

-- Handle New User (Trigger to auto-create profile on signup)
-- Note: You must create this function in Supabase SQL Editor
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- STORAGE BUCKETS
-- You will need to create these manually in Supabase Dashboard:
-- 1. 'videos' bucket (public: true, accepted_mime_types: ['video/mp4', 'video/webm'])
-- 2. 'avatars' bucket (public: true, accepted_mime_types: ['image/*'])
