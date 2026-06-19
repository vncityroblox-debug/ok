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
  'blog': 'Bài Viết',
  'app': 'Chi Tiết',
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
        const href = '/' + segments.slice(0, i + 1).join('/');
        const name = nameMap[seg] || seg;
        const isLast = i === segments.length - 1;

        return (
          <span key={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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
