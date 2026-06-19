'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppWindow, Terminal, Clock, ArrowRight, FileText } from 'lucide-react';
import styles from './home.module.css';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  created_at: string;
}

export default function HomePage() {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
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
      const { fetchPublicSettings, fetchPublicPosts } = await import('@/lib/public-fetch');
      const [settings, posts] = await Promise.all([
        fetchPublicSettings(),
        fetchPublicPosts(4),
      ]);

      if (settings) {
        if (settings.home_hero_title) setHeroTitle(settings.home_hero_title);
        if (settings.home_hero_subtitle) setHeroSubtitle(settings.home_hero_subtitle);
      }

      setRecentPosts(posts || []);
    } catch (err) {
      console.error('Fetch home page data error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const [heroMain, heroHighlight] = heroTitle.includes('|')
    ? heroTitle.split('|', 2).map((part) => part.trim())
    : [heroTitle.trim(), ''];

  const sections = [
    { label: 'Ứng Dụng', href: '/ung-dung', icon: AppWindow, color: 'var(--color-primary)' },
    { label: 'Mã Nguồn', href: '/ma-nguon', icon: Terminal, color: 'var(--color-success)' },
    { label: 'CronJobs', href: '/cron-jobs', icon: Clock, color: '#10b981' },
    { label: 'Công Cụ', href: '/tools/hub', icon: ArrowRight, color: 'var(--color-warning)' },
  ];

  return (
    <div className="container">
      {/* Hero Header */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          {heroMain}
          {heroHighlight ? <> <span>{heroHighlight}</span></> : null}
        </h1>
        <p className={styles.heroSubtitle} dangerouslySetInnerHTML={{ __html: heroSubtitle }} />
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
