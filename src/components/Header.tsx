'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthGuard';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', user.email)
        .single();
      setIsAdmin(!!data);
    })();
  }, [user?.email]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    { name: 'Mã Nguồn', path: '/ma-nguon' },
    { name: 'Bài Viết', path: '/blog' },
  ];

  const handleLogout = async () => {
    setShowUserMenu(false);
    await supabase.auth.signOut();
    router.push('/');
  };

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
          <div className={styles.navMobileLogo}>
            {siteIconUrl ? (
              <img src={siteIconUrl} alt={siteName} className={styles.navMobileLogoImg} />
            ) : (
              <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'hsl(var(--text-primary))' }}>{siteName}</span>
            )}
          </div>
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

          {/* User Menu */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            {user ? (
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px',
                  background: showUserMenu ? 'hsla(var(--color-primary) / 0.1)' : 'transparent',
                  border: '1px solid hsl(var(--border-glass))',
                  cursor: 'pointer', fontSize: '0.85rem',
                  color: 'hsl(var(--text-primary))', fontWeight: 500,
                }}
              >
                <User size={16} />
                <span className={styles.userMenuName}>
                  {user.email?.split('@')[0]}
                </span>
                <ChevronDown size={14} style={{
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }} />
              </button>
            ) : (
              <Link
                href="/dang-nhap"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '8px',
                  background: 'hsl(var(--color-primary))',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Đăng Nhập
              </Link>
            )}
            {showUserMenu && user && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                minWidth: '200px', background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-glass))',
                borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                padding: '8px', zIndex: 100,
              }}>
                <div style={{
                  padding: '10px 14px', borderBottom: '1px solid hsl(var(--border-glass))',
                  marginBottom: '4px',
                }}>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Tài khoản</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-all' }}>{user.email}</div>
                </div>
                <Link href="/profile" onClick={() => setShowUserMenu(false)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: '8px',
                  fontSize: '0.9rem', color: 'hsl(var(--text-primary))',
                  textDecoration: 'none',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(var(--color-primary) / 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={16} />
                  Hồ Sơ
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setShowUserMenu(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', borderRadius: '8px',
                    fontSize: '0.9rem', color: 'hsl(var(--text-primary))',
                    textDecoration: 'none',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(var(--color-primary) / 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Shield size={16} />
                    Quản Trị
                  </Link>
                )}
                <button onClick={handleLogout} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: '8px',
                  fontSize: '0.9rem', color: '#ef4444', width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={16} />
                  Đăng Xuất
                </button>
              </div>
            )}
          </div>

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
