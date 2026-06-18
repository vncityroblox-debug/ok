'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Unlock, Download, AppWindow, ArrowRight } from 'lucide-react';
import styles from './home.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

interface AppItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  main_image_url: string;
  is_locked: boolean;
  category_id: string;
  categories: { name: string; slug: string } | null;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [heroTitle, setHeroTitle] = useState('Kho Tài Nguyên|Tuyển Chọn');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'Khám phá và tải xuống hàng loạt ứng dụng, mã nguồn, công cụ tiện ích và tài nguyên công nghệ tốt nhất hoàn toàn miễn phí.'
  );

  // 1. Log visit and Fetch initial data
  useEffect(() => {
    async function initPage() {
      await logVisit();
      await fetchData();
    }
    initPage();
  }, []);

  async function logVisit() {
    try {
      // Manage unique session ID per visitor in localStorage
      let sessionId = localStorage.getItem('visitor_session_id');
      if (!sessionId) {
        // Generate a random UUID
        sessionId = crypto.randomUUID();
        localStorage.setItem('visitor_session_id', sessionId);
      }

      // Record visit to API
      await fetch('/api/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch (err) {
      console.error('Failed to log visit:', err);
    }
  }

  async function fetchData() {
    setIsLoading(true);
    try {
      const [catsRes, settRes, appsRes] = await Promise.all([
        fetch('/api/public?type=categories'),
        fetch('/api/public?type=home&app_type=app'),
        fetch('/api/public?type=apps&app_type=app'),
      ]);
      const catsData = await catsRes.json();
      const homeData = await settRes.json();
      const appsData = await appsRes.json();

      setCategories(catsData.data || []);

      if (homeData.data?.settings) {
        if (homeData.data.settings.home_hero_title) setHeroTitle(homeData.data.settings.home_hero_title);
        if (homeData.data.settings.home_hero_subtitle) setHeroSubtitle(homeData.data.settings.home_hero_subtitle);
      }

      setApps(appsData.data || []);
    } catch (err) {
      console.error('Fetch home page data error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter apps based on active category and search input
  const filteredApps = apps.filter((app) => {
    const matchesCategory =
      selectedCategory === 'all' || app.categories?.slug === selectedCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [heroMain, heroHighlight] = heroTitle.includes('|')
    ? heroTitle.split('|', 2).map((part) => part.trim())
    : [heroTitle.trim(), ''];

  return (
    <div className="container">
      {/* Hero Header */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          {heroMain}
          {heroHighlight ? <> <span>{heroHighlight}</span></> : null}
        </h1>
        <p className={styles.heroSubtitle}>
          {heroSubtitle}
        </p>
      </section>

      {/* Search and filter toolbar */}
      <section className={styles.searchSection}>
        <div className={styles.searchBarWrapper} id="guide-search">
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories Bar */}
        <div className={styles.categoriesWrapper} id="guide-categories">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`${styles.categoryPill} ${
              selectedCategory === 'all' ? styles.categoryPillActive : ''
            }`}
          >
            Tất cả
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`${styles.categoryPill} ${
                selectedCategory === cat.slug ? styles.categoryPillActive : ''
              }`}
            >
              {cat.image_url && (
                <img src={cat.image_url} alt={cat.name} className={styles.categoryIcon} />
              )}
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Apps Showcase Grid */}
      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppWindow size={22} style={{ color: 'hsl(var(--color-primary))' }} />
          Danh Sách Cho Bạn
        </h2>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải dữ liệu...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>Không tìm thấy kết quả phù hợp.</p>
          </div>
        ) : (
          <div className={styles.appsGrid} id="guide-apps">
            {filteredApps.map((app) => (
              <div key={app.id} className={styles.appCard}>
                {/* Lock Badge */}
                <div
                  className={styles.appBadge}
                  style={{
                    background: app.is_locked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: app.is_locked ? '#ef4444' : '#10b981',
                  }}
                >
                  {app.is_locked ? (
                    <>
                      <Lock size={12} /> Khóa
                    </>
                  ) : (
                    <>
                      <Unlock size={12} /> Mở
                    </>
                  )}
                </div>

                <div className={styles.appCardHeader}>
                  <img src={app.main_image_url} alt={app.name} className={styles.appIcon} />
                  <div>
                    <h3 className={styles.appTitle}>{app.name}</h3>
                    <span className={styles.appCategoryName}>
                      {app.categories?.name || 'Không xác định'}
                    </span>
                  </div>
                </div>

                <p className={styles.appDescription}>{app.description}</p>

                <div className={styles.appCardFooter}>
                  <Link href={`/app/${app.slug}`} className="neon-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Chi tiết
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
