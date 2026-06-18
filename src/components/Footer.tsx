'use client';

import Link from 'next/link';
import styles from './components.module.css';

interface FooterProps {
  siteName?: string;
  siteDescription?: string;
  footerText?: string;
}

export default function Footer({ siteName = 'App Store', siteDescription, footerText }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <h4>Về Chúng Tôi</h4>
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
                <Link href="/blog">Bài Viết & Blog</Link>
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
              <li>
                <Link href="/?cat=games">Trò Chơi</Link>
              </li>
              <li>
                <Link href="/?cat=productivity">Hiệu Suất</Link>
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
