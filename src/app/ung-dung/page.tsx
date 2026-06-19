'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Lock, Unlock, Download, ArrowRight } from 'lucide-react';
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
      const appsRes = await fetch('/api/public?type=apps&app_type=app');
      const appsData = await appsRes.json();
      setApps(appsData.data || []);
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
        <h1 className={styles.heroTitle}>
          Kho Ứng Dụng <span>Tuyển Chọn</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Khám phá và tải xuống hàng loạt ứng dụng, phần mềm, và công cụ hữu ích hoàn toàn miễn phí.
        </p>
      </section>

      <section style={{ marginBottom: '80px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={22} style={{ color: 'hsl(var(--color-primary))' }} />
          Ứng Dụng Cho Bạn
        </h2>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải danh sách ứng dụng...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', borderRadius: '16px', border: '1px dashed hsl(var(--border-glass))' }}>
            <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>Không tìm thấy ứng dụng phù hợp.</p>
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
