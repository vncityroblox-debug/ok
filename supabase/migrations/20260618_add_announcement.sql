-- ============================================================
-- Migration: Thêm cột announcement_html vào site_settings
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS announcement_html text DEFAULT '';
