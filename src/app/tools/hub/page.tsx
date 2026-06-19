'use client';

import Link from 'next/link';
import { QrCode, Link2, Webhook, Key, Code, Database, Globe, Image, ArrowRight } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import styles from '../../home.module.css';

const tools = [
  {
    name: 'QR Code Generator',
    description: 'Tạo mã QR từ text, URL, WiFi và nhiều định dạng khác.',
    href: '/tools/qr-code',
    icon: QrCode,
    color: 'var(--color-primary)',
  },
  {
    name: 'URL Shortener',
    description: 'Rút gọn liên kết nhanh chóng và theo dõi lượt truy cập.',
    href: '/tools/shorten',
    icon: Link2,
    color: 'var(--color-success)',
  },
  {
    name: 'Webhook Tester',
    description: 'Kiểm tra và gỡ lỗi webhook endpoint dễ dàng.',
    href: '/tools/webhook-tester',
    icon: Webhook,
    color: 'var(--color-warning)',
  },
  {
    name: 'Password Generator',
    description: 'Tạo mật khẩu mạnh với tùy chỉnh độ dài và ký tự.',
    href: '/tools/password',
    icon: Key,
    color: 'var(--color-danger)',
  },
  {
    name: 'JSON Formatter',
    description: 'Định dạng, kiểm tra và hiển thị JSON trực quan.',
    href: '/tools/json-formatter',
    icon: Code,
    color: 'var(--color-primary)',
  },
  {
    name: 'Fake Data Generator',
    description: 'Tạo dữ liệu mẫu cho thử nghiệm và phát triển.',
    href: '/tools/fake-data',
    icon: Database,
    color: 'var(--color-success)',
  },
  {
    name: 'WHOIS Lookup',
    description: 'Tra cứu thông tin tên miền và chủ sở hữu.',
    href: '/tools/whois',
    icon: Globe,
    color: 'var(--color-warning)',
  },
  {
    name: 'Image Compressor',
    description: 'Nén hình ảnh giữ chất lượng, giảm dung lượng.',
    href: '/tools/image-compressor',
    icon: Image,
    color: 'var(--color-primary)',
  },
];

export default function ToolsHubPage() {
  return (
    <div className="container">
      <Breadcrumbs />

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Công Cụ <span>Miễn Phí</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Bộ sưu tập công cụ trực tuyến miễn phí, giúp bạn xử lý công việc nhanh chóng và hiệu quả.
        </p>
      </section>

      <section className={styles.toolsGrid}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} className={styles.toolCard}>
              <div
                className={styles.toolIcon}
                style={{
                  background: `hsla(${tool.color} / 0.1)`,
                  color: `hsl(${tool.color})`,
                }}
              >
                <Icon size={28} />
              </div>
              <div className={styles.toolInfo}>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.toolDescription}>{tool.description}</p>
              </div>
              <ArrowRight size={18} className={styles.toolArrow} />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
