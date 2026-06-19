'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const nameMap: Record<string, string> = {
  '': 'Trang Chủ',
  'ung-dung': 'Ứng Dụng',
  'ma-nguon': 'Mã Nguồn',
  'tien-ich': 'Tiện Ích',
  '2fa': 'Lấy 2FA',
  'tools': 'Công Cụ',
  'hub': 'Tất Cả Công Cụ',
  'qr-code': 'QR Code',
  'shorten': 'Rút Ngắn Link',
  'password': 'Tạo Mật Khẩu',
  'json-formatter': 'JSON Formatter',
  'fake-data': 'Tạo Dữ Liệu',
  'whois': 'WHOIS & DNS',
  'image-compressor': 'Nén Ảnh',
  'cron-jobs': 'CronJobs',
  'blog': 'Bài Viết',
  'app': 'Ứng Dụng',
  'phim-hay': 'Phim Hay',
  'admin': 'Quản Trị',
  'settings': 'Cài Đặt',
  'categories': 'Danh Mục',
  'keys': 'Key',
  'users': 'Người Dùng',
  'posts': 'Bài Viết',
  'apps': 'Ứng Dụng',
  'source-codes': 'Mã Nguồn',
  'login': 'Đăng Nhập',
  'dang-nhap': 'Đăng Nhập',
  'dang-ky': 'Đăng Ký',
  'quen-mat-khau': 'Quên Mật Khẩu',
  'profile': 'Hồ Sơ',
};

const redirectMap: Record<string, string> = {
  '/tools': '/tools/hub',
  '/app': '/ung-dung',
  '/tien-ich': '/tools/hub',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (pathname === '/' || pathname?.startsWith('/admin')) return null;

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.88rem',
        color: 'hsl(var(--text-muted))',
        padding: '20px 0 0 0',
        flexWrap: 'wrap',
      }}
    >
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: 'hsl(var(--text-secondary))',
          textDecoration: 'none',
          fontWeight: 500,
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--color-primary))')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-secondary))')}
      >
        <ArrowLeft size={15} style={{ marginRight: '4px' }} />
        Trang Chủ
      </Link>

      {segments.map((seg, i) => {
        const rawHref = '/' + segments.slice(0, i + 1).join('/');
        const href = redirectMap[rawHref] || rawHref;
        const name = nameMap[seg] || seg;
        const isLast = i === segments.length - 1;

        return (
          <span key={rawHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'hsl(var(--border-light))' }}>/</span>
            {isLast ? (
              <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 600 }}>{name}</span>
            ) : (
              <Link
                href={href}
                style={{
                  color: 'hsl(var(--text-secondary))',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--color-primary))')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-secondary))')}
              >
                {name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
