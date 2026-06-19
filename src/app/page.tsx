'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppWindow, Terminal, ShieldCheck, ArrowRight, FileText, Grid3X3, Search } from 'lucide-react';
import styles from './home.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  created_at: string;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [heroTitle, setHeroTitle] = useState('Kho Tài Nguyên|Tuyển Chọn');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'Khám phá và tải xuống hàng loạt ứng dụng, mã nguồn, công cụ tiện ích và tài nguyên công nghệ tốt nhất hoàn toàn miễn phí.'
  );

  useEffect(() => {
    async function init() {
      await logVisit();
      await fetchData();
    }
    init();
  }, []);

  async function logVisit() {
    try {
      let sessionId = localStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('visitor_session_id', sessionId);
      }
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
      const [catsRes, settRes, postsRes] = await Promise.all([
        fetch('/api/public?type=categories'),
        fetch('/api/public?type=home&app_type=app'),
        fetch('/api/public?type=posts&limit=4'),
      ]);
      const catsData = await catsRes.json();
      const homeData = await settRes.json();
      const postsData = await postsRes.json();

      setCategories(catsData.data || []);

      if (homeData.data?.settings) {
        if (homeData.data.settings.home_hero_title) setHeroTitle(homeData.data.settings.home_hero_title);
        if (homeData.data.settings.home_hero_subtitle) setHeroSubtitle(homeData.data.settings.home_hero_subtitle);
      }

      setRecentPosts(postsData.data || []);
    } catch (err) {
      console.error('Fetch home page data error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [heroMain, heroHighlight] = heroTitle.includes('|')
    ? heroTitle.split('|', 2).map((part) => part.trim())
    : [heroTitle.trim(), ''];

  const sections = [
    { label: 'Ứng Dụng', href: '/ung-dung', icon: AppWindow, color: 'var(--color-primary)' },
    { label: 'Mã Nguồn', href: '/ma-nguon', icon: Terminal, color: 'var(--color-success)' },
    { label: 'Tiện Ích', href: '/tien-ich', icon: ShieldCheck, color: 'var(--color-warning)' },
  ];

  return (
    <div className="container">
      {/* Hero Header */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          {heroMain}
          {heroHighlight ? <> <span>{heroHighlight}</span></> : null}
        </h1>
        <p className={styles.heroSubtitle}>{heroSubtitle}</p>
      </section>

      {/* Search */}
      <section className={styles.searchSection}>
        <div className={styles.searchBarWrapper}>
          <Search size={20} style={{ width: 20, height: 20, flexShrink: 0, color: 'hsl(var(--text-secondary))' }} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Tìm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Quick Sections */}
      <section className={styles.sectionsRow}>
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link key={sec.label} href={sec.href} className={styles.sectionCard}>
              <div className={styles.sectionIcon} style={{ background: `hsla(${sec.color} / 0.1)`, color: `hsl(${sec.color})` }}>
                <Icon size={24} />
              </div>
              <div>
                <div className={styles.sectionLabel}>{sec.label}</div>
                <div className={styles.sectionAction}>Khám phá ngay <ArrowRight size={14} /></div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Category Grid */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Grid3X3 size={22} style={{ color: 'hsl(var(--color-primary))' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Danh Mục</h2>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải dữ liệu...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', borderRadius: '16px', border: '1px dashed hsl(var(--border-glass))' }}>
            <p style={{ color: 'hsl(var(--text-muted))' }}>Không tìm thấy danh mục phù hợp.</p>
          </div>
        ) : (
          <div className={styles.catGrid}>
            {filteredCategories.map((cat) => (
              <div key={cat.id} className={styles.catCard}>
                <img
                  src={cat.image_url || '/placeholder-icon.png'}
                  alt={cat.name}
                  className={styles.catImage}
                />
                <h3 className={styles.catName}>{cat.name}</h3>
                <div className={styles.catActions}>
                  <Link href={`/tien-ich?cat=${cat.slug}`} className={styles.catBtn}>
                    <AppWindow size={14} /> Apps
                  </Link>
                  <Link href={`/ma-nguon?cat=${cat.slug}`} className={styles.catBtn}>
                    <Terminal size={14} /> Mã Nguồn
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <section style={{ marginBottom: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={22} style={{ color: 'hsl(var(--color-primary))' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Bài Viết Mới</h2>
            </div>
            <Link href="/blog" style={{ fontSize: '0.9rem', color: 'hsl(var(--color-primary))', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          <div className={styles.blogGrid}>
            {recentPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className={styles.blogCard}>
                <h3 className={styles.blogTitle}>{post.title}</h3>
                <p className={styles.blogMeta}>{new Date(post.created_at).toLocaleDateString('vi-VN')}</p>
                {post.excerpt && <p className={styles.blogExcerpt}>{post.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
