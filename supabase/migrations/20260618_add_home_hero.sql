-- ============================================================
-- Migration: Thêm cột hero trang chủ vào site_settings
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS home_hero_title text DEFAULT 'Kho Tài Nguyên|Tuyển Chọn';

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS home_hero_subtitle text DEFAULT 'Khám phá và tải xuống hàng loạt ứng dụng, mã nguồn, công cụ tiện ích và tài nguyên công nghệ tốt nhất hoàn toàn miễn phí.';
