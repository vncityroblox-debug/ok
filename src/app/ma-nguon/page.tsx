'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Lock, Unlock, Download, Terminal, ArrowRight } from 'lucide-react';
import styles from '../home.module.css';

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

export default function SourceCodePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

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
      const [catsRes, appsRes] = await Promise.all([
        fetch('/api/public?type=categories'),
        fetch('/api/public?type=apps&app_type=source_code'),
      ]);
      const catsData = await catsRes.json();
      const appsData = await appsRes.json();

      setCategories(catsData.data || []);
      setApps(appsData.data || []);
    } catch (err) {
      console.error('Fetch page data error:', err);
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

  return (
    <div className="container">
      {/* Hero Header */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Kho Mã Nguồn <span>Tuyển Chọn</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Khám phá và tải xuống hàng loạt mã nguồn, mẫu website, và tài nguyên lập trình tốt nhất hoàn toàn miễn phí.
        </p>
      </section>

      {/* Search and filter toolbar */}
      <section className={styles.searchSection}>
        <div className={styles.searchBarWrapper} id="guide-search">
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm mã nguồn..."
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
          <Terminal size={22} style={{ color: 'hsl(var(--color-primary))' }} />
          Mã Nguồn Cho Bạn
        </h2>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải danh sách mã nguồn...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>Không tìm thấy mã nguồn phù hợp.</p>
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
