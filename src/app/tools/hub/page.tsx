'use client';

import Link from 'next/link';
import { QrCode, Link2, Key, Code, Database, Globe, Image, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';

const tools = [
  {
    name: 'QR Code Generator',
    description: 'Tạo mã QR từ text, URL, WiFi và nhiều định dạng khác.',
    href: '/tools/qr-code',
    icon: QrCode,
    color: 'hsl(var(--color-primary))',
  },
  {
    name: 'URL Shortener',
    description: 'Rút gọn liên kết nhanh chóng và theo dõi lượt truy cập.',
    href: '/tools/shorten',
    icon: Link2,
    color: '#10b981',
  },
  {
    name: 'Password Generator',
    description: 'Tạo mật khẩu mạnh với tùy chỉnh độ dài và ký tự.',
    href: '/tools/password',
    icon: Key,
    color: '#ef4444',
  },
  {
    name: 'JSON Formatter',
    description: 'Định dạng, kiểm tra và hiển thị JSON trực quan.',
    href: '/tools/json-formatter',
    icon: Code,
    color: '#8b5cf6',
  },
  {
    name: 'Fake Data Generator',
    description: 'Tạo dữ liệu mẫu cho thử nghiệm và phát triển.',
    href: '/tools/fake-data',
    icon: Database,
    color: '#06b6d4',
  },
  {
    name: 'WHOIS & DNS Lookup',
    description: 'Tra cứu thông tin tên miền và bản ghi DNS.',
    href: '/tools/whois',
    icon: Globe,
    color: '#f59e0b',
  },
  {
    name: 'Image Compressor',
    description: 'Nén hình ảnh giữ chất lượng, giảm dung lượng.',
    href: '/tools/image-compressor',
    icon: Image,
    color: '#10b981',
  },
];

export default function ToolsHubPage() {
  return (
    <div className="container">
      <Breadcrumbs />

      <section style={{ textAlign: 'center', padding: '60px 0 40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'hsl(var(--text-primary))', marginBottom: '12px' }}>
          Công Cụ <span style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Miễn Phí</span>
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.05rem', maxWidth: 540, margin: '0 auto' }}>
          Bộ sưu tập công cụ trực tuyến miễn phí, giúp bạn xử lý công việc nhanh chóng và hiệu quả.
        </p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '60px' }}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 22px',
              borderRadius: '14px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-glass))',
              textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = tool.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border-glass))'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${tool.color}15`, color: tool.color, flexShrink: 0,
              }}>
                <Icon size={26} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: '4px' }}>{tool.name}</h3>
                <p style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4, margin: 0 }}>{tool.description}</p>
              </div>
              <ArrowRight size={18} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
