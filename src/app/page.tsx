'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  Code2, 
  Sliders, 
  Wrench, 
  ArrowRight, 
  FileText, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Share2 
} from 'lucide-react';
import styles from './home.module.css';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  created_at: string;
}

export default function HomePage() {
  const [hasEntered, setHasEntered] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [heroTitle, setHeroTitle] = useState('Hệ Thống Công Nghệ|Thiết Bị Cao Cấp');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'Khám phá và truy cập kho thiết bị thông minh, giải pháp phần mềm, mã nguồn và hệ thống tự động hóa tối tân.'
  );

  useEffect(() => {
    // Check if user has already entered in this session
    const entered = sessionStorage.getItem('has_entered_tech_portal') === 'true';
    if (entered) {
      setHasEntered(true);
    }
    
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
        if (settings.home_hero_title) {
          // Replace general title with high-tech phrasing if it is default
          if (settings.home_hero_title === 'Kho Tài Nguyên|Tuyển Chọn') {
            setHeroTitle('Hệ Thống Công Nghệ|Thiết Bị Cao Cấp');
          } else {
            setHeroTitle(settings.home_hero_title);
          }
        }
        if (settings.home_hero_subtitle) {
          if (settings.home_hero_subtitle.includes('hàng loạt ứng dụng')) {
            setHeroSubtitle('Khám phá và truy cập kho thiết bị thông minh, giải pháp phần mềm, mã nguồn và hệ thống tự động hóa tối tân hoàn toàn miễn phí.');
          } else {
            setHeroSubtitle(settings.home_hero_subtitle);
          }
        }
      }

      setRecentPosts(posts || []);
    } catch (err) {
      console.error('Fetch home page data error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleEnterPortal = () => {
    setIsLeaving(true);
    sessionStorage.setItem('has_entered_tech_portal', 'true');
    setTimeout(() => {
      setHasEntered(true);
    }, 800); // Match CSS transition duration
  };

  const [heroMain, heroHighlight] = heroTitle.includes('|')
    ? heroTitle.split('|', 2).map((part) => part.trim())
    : [heroTitle.trim(), ''];

  const sections = [
    { label: 'Thiết Bị & Giải Pháp', href: '/ung-dung', icon: Cpu, color: '188 86% 53%' }, // cyan
    { label: 'Mã Nguồn & Firmware', href: '/ma-nguon', icon: Code2, color: '142 70% 50%' }, // green
    { label: 'Hệ Thống Tự Động', href: '/cron-jobs', icon: Sliders, color: '262 80% 63%' }, // violet
    { label: 'Công Cụ Kỹ Thuật', href: '/tools/hub', icon: Wrench, color: '38 92% 50%' }, // amber
  ];

  return (
    <>
      {/* 1. IMMERSIVE LANDING PAGE */}
      {(!hasEntered || isLeaving) && (
        <div className={`${styles.landingOverlay} ${isLeaving ? styles.fadeOutLanding : ''}`}>
          <div className={styles.gridBg}></div>
          <div className={styles.hudContainer}>
            <div className={styles.radarRing1}></div>
            <div className={styles.radarRing2}></div>
            <div className={styles.radarRing3}></div>
          </div>
          
          <div className={styles.landingContent}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'hsla(var(--color-primary) / 0.1)', border: '1px solid hsla(var(--color-primary) / 0.3)', borderRadius: '50px', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--color-primary))', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Zap size={14} /> Center Platform v2.0
            </div>
            
            <h1 className={styles.landingTitle}>
              Cổng Kết Nối <span>Công Nghệ & Thiết Bị</span>
            </h1>
            
            <p className={styles.landingSubtitle}>
              Hệ thống cung cấp, chia sẻ thiết bị thông minh, giải pháp phần mềm, firmware mã nguồn và hệ thống tự động hóa tối tân hàng đầu.
            </p>

            {/* Stats list */}
            <div className={styles.landingStats}>
              <div className={styles.landingStatItem}>
                <div className={styles.landingStatVal}>150+</div>
                <div className={styles.landingStatLabel}>Thiết Bị Cao Cấp</div>
              </div>
              <div className={styles.landingStatItem}>
                <div className={styles.landingStatVal}>40+</div>
                <div className={styles.landingStatLabel}>Giải Pháp Firmware</div>
              </div>
              <div className={styles.landingStatItem}>
                <div className={styles.landingStatVal}>100%</div>
                <div className={styles.landingStatLabel}>Vận Hành Tự Động</div>
              </div>
            </div>

            {/* Main areas cards preview */}
            <div className={styles.landingCards}>
              <div className={styles.landingCard}>
                <div className={styles.landingCardIcon} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
                  <Cpu size={24} />
                </div>
                <h3 className={styles.landingCardTitle}>Thiết Bị & Giải Pháp</h3>
                <p className={styles.landingCardDesc}>Xem cấu hình thiết bị, tải các ứng dụng đồng hành.</p>
              </div>
              <div className={styles.landingCard}>
                <div className={styles.landingCardIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <Code2 size={24} />
                </div>
                <h3 className={styles.landingCardTitle}>Mã Nguồn & Firmware</h3>
                <p className={styles.landingCardDesc}>Tải mã nguồn, firmware nạp chíp và tài nguyên phát triển.</p>
              </div>
              <div className={styles.landingCard}>
                <div className={styles.landingCardIcon} style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                  <Sliders size={24} />
                </div>
                <h3 className={styles.landingCardTitle}>Hệ Thống Tự Động</h3>
                <p className={styles.landingCardDesc}>Lịch trình CronJobs tự động hóa các tác vụ thiết bị.</p>
              </div>
              <div className={styles.landingCard}>
                <div className={styles.landingCardIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <Wrench size={24} />
                </div>
                <h3 className={styles.landingCardTitle}>Công Cụ Kỹ Thuật</h3>
                <p className={styles.landingCardDesc}>Các tiện ích chuyển đổi, phân tích kỹ thuật nhanh chóng.</p>
              </div>
            </div>

            {/* CTA Enter Button */}
            <button onClick={handleEnterPortal} className={styles.landingCtaBtn}>
              Truy Cập Hệ Thống
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 2. HIGH TECH DASHBOARD PANEL (Shown after enter) */}
      {hasEntered && (
        <div className="container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          
          {/* Dashboard Hero */}
          <section className={styles.hero}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'hsl(var(--color-primary))', border: '1px solid hsla(var(--color-primary) / 0.2)', padding: '4px 12px', borderRadius: '50px', background: 'hsla(var(--color-primary) / 0.05)', marginBottom: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Activity size={12} style={{ animation: 'pulse 1.5s infinite' }} /> Bảng Điều Khiển Hệ Thống
            </div>
            <h1 className={styles.heroTitle}>
              {heroMain}
              {heroHighlight ? <> <span>{heroHighlight}</span></> : null}
            </h1>
            <p className={styles.heroSubtitle} dangerouslySetInnerHTML={{ __html: heroSubtitle }} />
          </section>

          {/* Quick Modules Control Grid */}
          <div className={styles.controlGrid}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Layers size={18} style={{ color: 'hsl(var(--color-primary))' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'hsl(var(--text-secondary))' }}>
                Phân Hệ Thiết Bị Công Nghệ
              </span>
            </div>
            
            <section className={styles.sectionsRow} style={{ marginBottom: 0 }}>
              {sections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <Link key={sec.label} href={sec.href} className={styles.sectionCard} style={{ border: `1px solid hsla(${sec.color} / 0.15)` }}>
                    <div className={styles.sectionIcon} style={{ background: `hsla(${sec.color} / 0.1)`, color: `hsl(${sec.color})` }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <div className={styles.sectionLabel}>{sec.label}</div>
                      <div className={styles.sectionAction}>
                        Mở Phân Hệ <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          </div>

          <div style={{ height: '48px' }}></div>

          {/* Recent Articles Section */}
          {recentPosts.length > 0 && (
            <section style={{ marginBottom: '80px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={22} style={{ color: 'hsl(var(--color-primary))' }} />
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tài Liệu & Tin Tức Kỹ Thuật
                  </h2>
                </div>
                <Link href="/blog" style={{ fontSize: '0.9rem', color: 'hsl(var(--color-primary))', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  Xem tất cả <ArrowRight size={14} />
                </Link>
              </div>
              
              <div className={styles.blogGrid}>
                {recentPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className={styles.blogCard}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'hsl(var(--color-primary))', marginBottom: '10px', fontWeight: 600 }}>
                      <span style={{ padding: '2px 6px', background: 'hsla(var(--color-primary) / 0.08)', borderRadius: '4px' }}>LOG_ENTRY</span>
                    </div>
                    <h3 className={styles.blogTitle}>{post.title}</h3>
                    <p className={styles.blogMeta}>
                      <span>PUBLISHED: {new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                    </p>
                    {post.excerpt && <p className={styles.blogExcerpt}>{post.excerpt}</p>}
                    <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'hsl(var(--color-primary))', fontWeight: 600 }}>
                      Đọc tài liệu <ArrowRight size={14} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
