'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './components.module.css';

interface HeaderProps {
  siteName?: string;
  siteIconUrl?: string;
}

export default function Header({ siteName = 'App Store', siteIconUrl: serverIconUrl }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localIconUrl, setLocalIconUrl] = useState('');
  const pathname = usePathname();
  const siteIconUrl = serverIconUrl || localIconUrl;

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

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const navItems = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Mã Nguồn', path: '/ma-nguon' },
    { name: 'Tiện Ích', path: '/tien-ich' },
    { name: 'Bài Viết', path: '/blog' },
  ];

  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) return null;

  return (
    <header className={styles.header} id="guide-header">
      <div className={styles.headerContainer}>
        <Link href="/" onClick={closeMenu}>
          <div className={styles.logo}>
            {siteIconUrl ? (
              <img src={siteIconUrl} alt={siteName} className={styles.logoIcon} />
            ) : (
              <span>{siteName}</span>
            )}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className={`${styles.nav} ${isOpen ? styles.navOpen : ''}`}>
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? pathname === '/'
                : pathname?.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.activeNavLink : ''}`}
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Mobile Hamburger Button */}
          <button className={styles.menuBtn} onClick={toggleMenu} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
