'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Lock, Unlock, Download, ArrowRight, Cpu } from 'lucide-react';
import styles from '../home.module.css';

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

function UngDungContent() {
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    async function initPage() {
      await logVisit();
      await fetchData();
    }
    initPage();
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
      const { fetchPublicApps } = await import('@/lib/public-fetch');
      const appsData = await fetchPublicApps('app');
      setApps(appsData as AppItem[]);
    } catch (err) {
      console.error('Fetch page data error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredApps = apps.filter((app) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q);
  });

  return (
    <div className="container">
      <Breadcrumbs />
      <section className={styles.hero}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'hsl(var(--color-primary))', border: '1px solid hsla(var(--color-primary) / 0.2)', padding: '4px 12px', borderRadius: '50px', background: 'hsla(var(--color-primary) / 0.05)', marginBottom: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Cpu size={12} style={{ animation: 'pulse 1.5s infinite' }} /> Phân Hệ Thiết Bị & Giải Pháp
        </div>
        <h1 className={styles.heroTitle}>
          Thiết Bị & <span>Giải Pháp Phần Mềm</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Khám phá cấu hình chi tiết và tải xuống các giải pháp điều khiển, phần mềm hệ thống tốt nhất.
        </p>
      </section>

      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <Cpu size={22} style={{ color: 'hsl(var(--color-primary))' }} />
          Danh Sách Thiết Bị & Giải Pháp
        </h2>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang kết nối cơ sở dữ liệu thiết bị...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', borderRadius: '16px', border: '1px dashed hsl(var(--border-glass))' }}>
            <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>Không tìm thấy thiết bị hoặc giải pháp phù hợp.</p>
          </div>
        ) : (
          <div className={styles.appsGrid} id="guide-apps">
            {filteredApps.map((app) => (
              <div key={app.id} className={styles.appCard}>
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

export default function UngDungPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 0', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>Đang tải...</div>}>
      <UngDungContent />
    </Suspense>
  );
}
