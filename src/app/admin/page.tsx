'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, Download, ArrowUpRight } from 'lucide-react';
import styles from './admin.module.css';

interface AppClickStat {
  name: string;
  count: number;
}

interface DailyVisitStat {
  dateLabel: string;
  count: number;
}

export default function AdminDashboard() {
  const [totalVisits, setTotalVisits] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [appClicks, setAppClicks] = useState<AppClickStat[]>([]);
  const [dailyVisits, setDailyVisits] = useState<DailyVisitStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/query?type=dashboard');
        const json = await res.json();
        if (!json.data) throw new Error('No data');

        setTotalVisits(json.data.totalVisits || 0);
        setTodayVisits(json.data.recentVisits || 0);
        setTotalDownloads(json.data.totalDownloads || 0);

        if (json.data.recentDownloads) {
          const aggMap: { [key: string]: number } = {};
          json.data.recentDownloads.forEach((row: any) => {
            const appName = row.apps?.name || 'Ứng dụng không xác định';
            aggMap[appName] = (aggMap[appName] || 0) + 1;
          });
          setAppClicks(Object.keys(aggMap).map(name => ({ name, count: aggMap[name] })).sort((a, b) => b.count - a.count).slice(0, 5));
        }

        if (json.data.visitsTimeline) {
          const dailyMap: { [key: string]: number } = {};
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dailyMap[d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })] = 0;
          }
          json.data.visitsTimeline.forEach((v: any) => {
            const dateStr = new Date(v.visited_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
            if (dailyMap[dateStr] !== undefined) dailyMap[dateStr]++;
          });
          setDailyVisits(Object.keys(dailyMap).map(dateLabel => ({ dateLabel, count: dailyMap[dateLabel] })));
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải số liệu thống kê...</p>
      </div>
    );
  }

  // Find max value in daily visits to scale graph height
  const maxVisitCount = Math.max(...dailyVisits.map((d) => d.count), 1);
  const maxAppClickCount = Math.max(...appClicks.map((a) => a.count), 1);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Thống Kê Tổng Quan
        </h1>
        <p className={styles.pageSubtitle}>
          Xem lưu lượng truy cập và hoạt động tải về trên toàn trang web
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Tổng lượt truy cập</span>
            <Users size={18} style={{ color: 'hsl(var(--color-primary))' }} />
          </div>
          <div className={styles.statValue}>{totalVisits.toLocaleString()}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Lượt truy cập hôm nay</span>
            <ArrowUpRight size={18} style={{ color: 'hsl(var(--color-secondary))' }} />
          </div>
          <div className={styles.statValue}>{todayVisits.toLocaleString()}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Tổng lượt tải xuống</span>
            <Download size={18} style={{ color: 'hsl(var(--color-accent))' }} />
          </div>
          <div className={styles.statValue}>{totalDownloads.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flexWrap: 'wrap' }}>
        {/* Daily Visits Chart */}
        <div className={styles.graphSection}>
          <div className={styles.graphHeader}>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Truy Cập 7 Ngày Qua</h3>
            <Users size={16} style={{ color: 'hsl(var(--text-muted))' }} />
          </div>

          <div className={styles.barChart}>
            {dailyVisits.map((item, idx) => {
              const heightPercent = `${(item.count / maxVisitCount) * 85}%`;
              return (
                <div key={idx} className={styles.barCol}>
                  <div className={styles.bar} style={{ height: heightPercent }}>
                    <div className={styles.barTooltip}>{item.count} lượt</div>
                  </div>
                  <span className={styles.barLabel}>{item.dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top App Downloads Chart */}
        <div className={styles.graphSection}>
          <div className={styles.graphHeader}>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Tải Nhiều Nhất</h3>
            <BarChart3 size={16} style={{ color: 'hsl(var(--text-muted))' }} />
          </div>

          {appClicks.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px' }}>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Chưa có lượt tải nào được ghi nhận</p>
            </div>
          ) : (
            <div className={styles.barChart}>
              {appClicks.map((item, idx) => {
                const heightPercent = `${(item.count / maxAppClickCount) * 85}%`;
                return (
                  <div key={idx} className={styles.barCol}>
                    <div
                      className={styles.bar}
                      style={{
                        height: heightPercent,
                        background: 'linear-gradient(to top, hsl(var(--color-accent)), hsl(var(--color-primary)))',
                      }}
                    >
                      <div className={styles.barTooltip}>{item.count} lượt</div>
                    </div>
                    <span className={styles.barLabel} title={item.name}>
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
