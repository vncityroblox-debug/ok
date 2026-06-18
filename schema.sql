-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. SITE SETTINGS TABLE
create table public.site_settings (
    id integer primary key default 1,
    site_name text not null default 'App Store & Blog',
    site_icon_url text default '',
    seo_title text default 'Awesome App Share & Blog Platform',
    seo_description text default 'Download apps and read latest articles',
    seo_tags text[] default array['apps', 'blog', 'download'],
    seo_thumbnail_url text,
    footer_text text default 'Vercel & Supabase',
    theme text default 'light',
    terms_content text default '',
    link4m_api_token text default '',
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint only_one_row check (id = 1)
);

-- Enable RLS for site_settings
alter table public.site_settings enable row level security;

-- Policies for site_settings
create policy "Allow public read site_settings" on public.site_settings
    for select using (true);

create policy "Allow admin edit site_settings" on public.site_settings
    for all using (auth.role() = 'authenticated');


-- 2. CATEGORIES TABLE
create table public.categories (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique,
    slug text not null unique,
    image_url text default '',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for categories
alter table public.categories enable row level security;

-- Policies for categories
create policy "Allow public read categories" on public.categories
    for select using (true);

create policy "Allow admin edit categories" on public.categories
    for all using (auth.role() = 'authenticated');


-- 3. APPS TABLE
create table public.apps (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    slug text not null unique,
    description text default '',
    main_image_url text default '',
    detail_images text[] default array[]::text[],
    download_link text not null,
    is_locked boolean default false not null,
    app_type text default 'app' not null,
    category_id uuid references public.categories(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for apps
alter table public.apps enable row level security;

-- Policies for apps
create policy "Allow public read apps" on public.apps
    for select using (true);

create policy "Allow admin edit apps" on public.apps
    for all using (auth.role() = 'authenticated');


-- 4. KEYS TABLE
create table public.keys (
    id uuid default uuid_generate_v4() primary key,
    key_value text not null unique,
    expiration_date timestamp with time zone not null,
    usage_limit integer not null default 1,
    usage_count integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for keys
alter table public.keys enable row level security;

-- Policies for keys - admin only, public cannot read or write directly!
create policy "Allow admin view and manage keys" on public.keys
    for all using (auth.role() = 'authenticated');


-- 5. APP KEYS JUNCTION TABLE
create table public.app_keys (
    key_id uuid references public.keys(id) on delete cascade not null,
    app_id uuid references public.apps(id) on delete cascade not null,
    primary key (key_id, app_id)
);

-- Enable RLS for app_keys - admin only
alter table public.app_keys enable row level security;

-- Policies for app_keys
create policy "Allow admin view and manage app_keys" on public.app_keys
    for all using (auth.role() = 'authenticated');


-- 6. POSTS TABLE (BLOG)
create table public.posts (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    slug text not null unique,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for posts
alter table public.posts enable row level security;

-- Policies for posts
create policy "Allow public read posts" on public.posts
    for select using (true);

create policy "Allow admin edit posts" on public.posts
    for all using (auth.role() = 'authenticated');


-- 7. ANALYTICS VISITS TABLE
create table public.analytics_visits (
    id uuid default uuid_generate_v4() primary key,
    session_id text not null,
    visited_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for analytics_visits
alter table public.analytics_visits enable row level security;

-- Policies for analytics_visits - anyone can insert to log a visit, only admin can view
create policy "Allow public insert visits" on public.analytics_visits
    for insert with check (true);

create policy "Allow admin view visits" on public.analytics_visits
    for select using (auth.role() = 'authenticated');


-- 8. ANALYTICS DOWNLOADS TABLE
create table public.analytics_downloads (
    id uuid default uuid_generate_v4() primary key,
    app_id uuid references public.apps(id) on delete cascade not null,
    clicked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for analytics_downloads
alter table public.analytics_downloads enable row level security;

-- Policies for analytics_downloads - public can insert, admin can view/manage
create policy "Allow public insert downloads" on public.analytics_downloads
    for insert with check (true);

create policy "Allow admin view downloads" on public.analytics_downloads
    for select using (auth.role() = 'authenticated');


-- Seed initial site_settings
insert into public.site_settings (id, site_name, seo_title, seo_description)
values (1, 'App Store & Blog', 'Awesome App Share & Blog Platform', 'Download apps and read latest articles')
on conflict (id) do nothing;

/* Admin Users Table */
create table public.admin_users (
    id uuid default uuid_generate_v4() primary key,
    email text not null unique,
    password_hash text not null,
    role_type int not null, -- 1 = FULL QUYỀN, 2 = RIÊNG LẺ
    permissions text[] default array[]::text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
