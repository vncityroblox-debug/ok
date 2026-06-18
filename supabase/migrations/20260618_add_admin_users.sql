-- ============================================================
-- Migration: Tạo bảng admin_users
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================================

-- Bật extension uuid nếu chưa có
create extension if not exists "uuid-ossp";

-- Tạo bảng admin_users
create table if not exists public.admin_users (
    id uuid primary key,                              -- khớp với auth.users.id
    email text not null unique,
    password_hash text not null,                      -- bcrypt hash (lưu thêm ngoài Supabase Auth)
    role_type int not null default 1,                 -- 1 = FULL QUYỀN, 2 = RIÊNG LẺ
    permissions text[] not null default array[]::text[],
    created_at timestamp with time zone not null default timezone('utc', now())
);

-- (Tuỳ chọn) Cho phép mọi người đọc — bạn có thể bật RLS và tạo policy nếu muốn
-- alter table public.admin_users enable row level security;
