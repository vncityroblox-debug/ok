'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './components.module.css';

interface FooterProps {
  siteName?: string;
  siteIconUrl?: string;
  siteDescription?: string;
  footerText?: string;
}

export default function Footer({ siteName = 'App Store', siteIconUrl: serverIconUrl, siteDescription, footerText }: FooterProps) {
  const [localIconUrl, setLocalIconUrl] = useState('');
  const siteIconUrl = serverIconUrl || localIconUrl;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (serverIconUrl) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('site_icon_url')
          .eq('id', 1)
          .single();
        if (data?.site_icon_url) setLocalIconUrl(data.site_icon_url);
      } catch {}
    })();
  }, [serverIconUrl]);

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            {siteIconUrl ? (
              <img src={siteIconUrl} alt={siteName} style={{ height: '40px', width: 'auto', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '12px' }} />
            ) : (
              <h4 style={{ marginBottom: '12px' }}>Về Chúng Tôi</h4>
            )}
            <p style={{ marginBottom: '16px' }}>
              {siteDescription || 'Nền tảng chia sẻ ứng dụng an toàn và các bài viết công nghệ hữu ích hàng đầu dành cho bạn.'}
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Bảo mật tuyệt đối • Tải xuống tốc độ cao
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4>Liên Kết Nhanh</h4>
            <ul>
              <li>
                <Link href="/">Trang Chủ</Link>
              </li>
              <li>
                <Link href="/ma-nguon">Mã Nguồn</Link>
              </li>
              <li>
                <Link href="/ung-dung">Ứng Dụng</Link>
              </li>
              <li>
                <Link href="/blog">Bài Viết</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Danh Mục</h4>
            <ul>
              <li>
                <Link href="/tien-ich">Tiện Ích</Link>
              </li>
              <li>
                <Link href="/tien-ich/2fa">Lấy Mã 2FA</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {currentYear} {siteName}. Tất cả các quyền được bảo lưu.</p>
          <p>
            Powered by <span style={{ color: 'hsl(var(--color-primary))', fontWeight: 'bold' }}>{footerText || 'Vercel & Supabase'}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
