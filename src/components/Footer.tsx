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
              {siteDescription || 'Hệ thống cung cấp, chia sẻ thiết bị thông minh, giải pháp phần mềm, firmware và tài liệu kỹ thuật cao cấp.'}
            </p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              Bảo mật tối đa • Kết nối tối ưu • Vận hành 24/7
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4>Liên Kết Nhanh</h4>
            <ul>
              <li>
                <Link href="/">Trang Chủ</Link>
              </li>
              <li>
                <Link href="/ung-dung">Thiết Bị & Giải Pháp</Link>
              </li>
              <li>
                <Link href="/ma-nguon">Mã Nguồn & Firmware</Link>
              </li>
              <li>
                <Link href="/blog">Tài Liệu Kỹ Thuật</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Phân Hệ Khác</h4>
            <ul>
              <li>
                <Link href="/tools/hub">Công Cụ Kỹ Thuật</Link>
              </li>
              <li>
                <Link href="/cron-jobs">Hệ Thống Tự Động</Link>
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
