'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './components.module.css';

interface HeaderProps {
  siteName?: string;
  siteIconUrl?: string;
}

export default function Header({ siteName = 'App Store', siteIconUrl: serverIconUrl }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localIconUrl, setLocalIconUrl] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
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

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setShowSearch(false);
  };
  const closeMenu = () => setIsOpen(false);

  const toggleSearch = () => {
    setShowSearch((prev) => {
      const next = !prev;
      if (next) {
        setIsOpen(false);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setShowSearch(false);
    setSearchQuery('');
    const base = pathname?.startsWith('/ma-nguon') ? '/ma-nguon'
      : pathname?.startsWith('/ung-dung') ? '/ung-dung'
      : '/ung-dung';
    router.push(`${base}?search=${encodeURIComponent(q)}`);
  };

  const navItems = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Công Cụ', path: '/tools/hub' },
    { name: 'CronJobs', path: '/cron-jobs' },
    { name: 'Tiện Ích', path: '/tien-ich' },
    { name: 'Mã Nguồn', path: '/ma-nguon' },
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search Toggle */}
          <button className={styles.searchBtn} onClick={toggleSearch} aria-label="Toggle search">
            <Search size={22} className={styles.searchSvg} />
          </button>

          {/* Mobile Hamburger Button */}
          <button className={`${styles.menuBtn} ${isOpen ? styles.menuBtnOpen : ''}`} onClick={toggleMenu} aria-label="Toggle menu">
            <span className={`${styles.menuBtnIcon} ${isOpen ? styles.menuBtnIconSpin : ''}`}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </span>
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      <div className={`${styles.searchDropdown} ${showSearch ? styles.searchDropdownOpen : ''}`}>
        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <Search size={20} className={styles.searchIcon} />
          <input
            ref={searchRef}
            type="search"
            className={styles.searchInput}
            placeholder="Tìm kiếm ứng dụng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className={styles.searchClose} onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
            ✕
          </button>
        </form>
      </div>
    </header>
  );
}
