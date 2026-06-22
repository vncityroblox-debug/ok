'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, Download, Eye, Activity, Clock, Search, RefreshCw, ChevronDown, Filter, MousePointerClick, UserPlus, TrendingUp } from 'lucide-react';
import styles from './admin.module.css';

interface AppClickStat { name: string; count: number }
interface DailyVisitStat { dateLabel: string; count: number }
interface ActivityLog { id: string; user_id: string; action: string; details: string; ip_address: string; created_at: string; username?: string }
interface LoginRecord { id: string; user_id: string; ip_address: string; device: string; created_at: string; username?: string }

const ACTION_TYPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'create_account', label: 'Tạo tài khoản' },
  { value: 'login', label: 'Đăng nhập' },
  { value: 'download', label: 'Tải xuống' },
  { value: 'gift_purchase', label: 'Mua quà' },
  { value: 'update_user', label: 'Cập nhật user' },
];

const PAGE_SIZE = 20;

function Skeleton({ h = 20, w = '100%', delay = 0 }: { h?: number; w?: string | number; delay?: number }) {
  return (
    <div className={styles.skeleton} style={{
      height: h, width: typeof w === 'number' ? w : w,
      animationDelay: `${delay}s`,
    }} />
  );
}

export default function AdminDashboard() {
  const [totalVisits, setTotalVisits] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [appClicks, setAppClicks] = useState<AppClickStat[]>([]);
  const [dailyVisits, setDailyVisits] = useState<DailyVisitStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [todayLogins, setTodayLogins] = useState(0);
  const [activeUsers7d, setActiveUsers7d] = useState(0);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<'activity' | 'login'>('activity');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activityByDay, setActivityByDay] = useState<{ dateLabel: string; count: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [debugRaw, setDebugRaw] = useState<string>('');

  const formatDate = (s: string) => s ? new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoaded(false);
    setDebugRaw('');
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/logs'),
      ]);
      const s = await statsRes.json().catch(() => ({}));
      const l = await logsRes.json().catch(() => ({ loginHistory: [], activityLogs: [] }));
      setDebugRaw(JSON.stringify({ statsStatus: statsRes.status, logsStatus: logsRes.status, stats: s }, null, 2).slice(0, 500));
      const allLogins = l.loginHistory || [];
      const allActivities = l.activityLogs || [];
      setTotalVisits(s.totalVisits ?? 0);
      setTodayVisits(s.recentVisits ?? 0);
      setTotalDownloads(s.totalDownloads ?? 0);
      setTotalUsers(s.totalUsers ?? 0);
      setTodayLogins(allLogins.filter((x: any) => new Date(x.created_at) >= todayStart).length);
      setActiveUsers7d(new Set(allLogins.filter((x: any) => new Date(x.created_at) >= new Date(sevenDaysAgo)).map((x: any) => x.user_id)).size);
      if (Array.isArray(s.recentDownloads)) {
        const m: Record<string, number> = {};
        s.recentDownloads.forEach((r: any) => { const n = r.apps?.name || 'Unknown'; m[n] = (m[n] || 0) + 1; });
        setAppClicks(Object.keys(m).map(n => ({ name: n, count: m[n] })).sort((a, b) => b.count - a.count).slice(0, 5));
      }
      if (Array.isArray(s.visitsTimeline)) {
        const m: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); m[d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })] = 0; }
        s.visitsTimeline.forEach((v: any) => { const k = new Date(v.visited_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' }); if (m[k] !== undefined) m[k]++; });
        setDailyVisits(Object.keys(m).map(k => ({ dateLabel: k, count: m[k] })));
      }
      const acts = (allActivities || []).map((a: any) => ({ ...a, username: a.user_profiles?.username || a.user_email || 'N/A' }));
      const logins = (allLogins || []).map((l: any) => ({ ...l, username: l.user_profiles?.username || l.user_email || 'N/A' }));
      setActivities(acts);
      setLoginHistory(logins);
      const am: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); am[d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })] = 0; }
      acts.forEach((a: any) => { const k = new Date(a.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' }); if (am[k] !== undefined) am[k]++; });
      setActivityByDay(Object.keys(am).map(k => ({ dateLabel: k, count: am[k] })));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); setTimeout(() => setLoaded(true), 100); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, actionFilter, dateFrom, dateTo]);

  const filteredActivities = activities.filter(a => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.username?.toLowerCase().includes(q) && !a.action?.toLowerCase().includes(q)) return false;
    }
    if (actionFilter !== 'all' && a.action !== actionFilter) return false;
    if (dateFrom && a.created_at?.slice(0, 10) < dateFrom) return false;
    if (dateTo && a.created_at?.slice(0, 10) > dateTo) return false;
    return true;
  });

  const filteredLogins = loginHistory.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      if (!l.username?.toLowerCase().includes(q) && !l.ip_address?.toLowerCase().includes(q)) return false;
    }
    if (dateFrom && l.created_at?.slice(0, 10) < dateFrom) return false;
    if (dateTo && l.created_at?.slice(0, 10) > dateTo) return false;
    return true;
  });

  const currentList = activeTab === 'activity' ? filteredActivities : filteredLogins;
  const visibleList = currentList.slice(0, visibleCount);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashHeader}>
          <div><Skeleton h={28} w={280} /><Skeleton h={16} w={200} delay={0.1} /></div>
          <Skeleton h={36} w={120} delay={0.15} />
        </div>
        <div className={styles.statsGrid}>
          {[1, 2, 3].map(i => <div key={i} className={styles.statCard}><Skeleton h={14} w="60%" delay={i * 0.05} /><Skeleton h={32} w="40%" delay={i * 0.08} /></div>)}
        </div>
        <div className={styles.chartsGrid}>
          {[1, 2].map(i => <div key={i} className={styles.graphSection}><Skeleton h={18} w="40%" delay={i * 0.1} /><div style={{ display: 'flex', gap: 8, height: 180, alignItems: 'flex-end', marginTop: 16 }}>{[1, 2, 3, 4, 5, 6, 7].map(j => <Skeleton key={j} h={40 + Math.random() * 100} w={30} delay={i * 0.1 + j * 0.05} />)}</div></div>)}
        </div>
      </div>
    );
  }

  const maxVisit = Math.max(...dailyVisits.map(d => d.count), 1);
  const maxClick = Math.max(...appClicks.map(a => a.count), 1);
  const maxActivity = Math.max(...activityByDay.map(d => d.count), 1);

  return (
    <div className={`${styles.dashboard} ${loaded ? styles.loaded : ''}`}>

      {/* ── Header ── */}
      <div className={styles.dashHeader}>
        <div className={styles.dashHeaderLeft}>
          <h1 className={styles.pageTitle}>Tổng Quan</h1>
          <p className={styles.pageSubtitle}>Phân tích lưu lượng truy cập và hoạt động</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchData}>
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {debugRaw && (
        <details style={{ marginBottom: 16, background: '#f8f9fa', borderRadius: 8, padding: 12, border: '1px solid #dee2e6', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#dc3545' }}>🔍 Debug API Response</summary>
          {debugRaw}
        </details>
      )}

      {/* ── Section: Lưu Lượng ── */}
      <div className={styles.sectionLabel}>
        <Eye size={16} /> Lưu Lượng Truy Cập
      </div>
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(13,110,253,0.1)', color: '#0d6efd' }}><Eye size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Tổng lượt truy cập</span>
            <span className={styles.statValue}>{totalVisits.toLocaleString()}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(25,135,84,0.1)', color: '#198754' }}><TrendingUp size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Hôm nay</span>
            <span className={styles.statValue}>{todayVisits.toLocaleString()}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(111,66,193,0.1)', color: '#6f42c1' }}><Download size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Tổng lượt tải</span>
            <span className={styles.statValue}>{totalDownloads.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className={styles.chartsGrid}>
        <div className={styles.graphSection}>
          <div className={styles.graphHeader}>
            <h3>Truy Cập 7 Ngày</h3>
            <Eye size={15} />
          </div>
          <div className={styles.barChart}>
            {dailyVisits.map((item, idx) => (
              <div key={idx} className={styles.barCol}>
                <div className={styles.bar} style={{ height: `${(item.count / maxVisit) * 85}%`, animationDelay: `${idx * 0.06}s` }}>
                  <div className={styles.barTooltip}>{item.count} lượt</div>
                </div>
                <span className={styles.barLabel}>{item.dateLabel}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.graphSection}>
          <div className={styles.graphHeader}>
            <h3>Tải Nhiều Nhất</h3>
            <MousePointerClick size={15} />
          </div>
          {appClicks.length === 0 ? (
            <div className={styles.emptyChart}>Chưa có lượt tải nào</div>
          ) : (
            <div className={styles.barChart}>
              {appClicks.map((item, idx) => (
                <div key={idx} className={styles.barCol}>
                  <div className={styles.bar} style={{
                    height: `${(item.count / maxClick) * 85}%`,
                    animationDelay: `${idx * 0.06}s`,
                    background: 'linear-gradient(to top, #6f42c1, #0d6efd)',
                  }}>
                    <div className={styles.barTooltip}>{item.count} lượt</div>
                  </div>
                  <span className={styles.barLabel} title={item.name}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section: Người Dùng ── */}
      <div className={styles.sectionLabel}>
        <Users size={16} /> Người Dùng
      </div>
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(13,110,253,0.1)', color: '#0d6efd' }}><Users size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Tổng người dùng</span>
            <span className={styles.statValue}>{totalUsers.toLocaleString()}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(25,135,84,0.1)', color: '#198754' }}><UserPlus size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Hôm nay đăng nhập</span>
            <span className={styles.statValue}>{todayLogins.toLocaleString()}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(111,66,193,0.1)', color: '#6f42c1' }}><Activity size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Hoạt động 7 ngày</span>
            <span className={styles.statValue}>{activeUsers7d.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Section: Hoạt Động ── */}
      <div className={styles.sectionLabel}>
        <Activity size={16} /> Nhật Ký Hoạt Động
      </div>

      {/* Filters & Tabs */}
      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <Search size={15} />
          <input type="text" placeholder="Tìm user / hành động..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {activeTab === 'activity' && (
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        )}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={styles.dateInput} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={styles.dateInput} />
      </div>

      <div className={styles.tabBar}>
        <button className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('activity')}>
          <Activity size={15} /> Hoạt Động <span className={styles.tabCount}>{filteredActivities.length}</span>
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'login' ? styles.tabBtnActive : ''}`} onClick={() => setActiveTab('login')}>
          <Clock size={15} /> Đăng Nhập <span className={styles.tabCount}>{filteredLogins.length}</span>
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>{activeTab === 'activity'
              ? ['Thời gian', 'User', 'Hành động', 'Chi tiết', 'IP'].map(h => <th key={h}>{h}</th>)
              : ['Thời gian', 'User', 'IP', 'Device'].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {visibleList.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyState}>Không có dữ liệu</td></tr>
            ) : activeTab === 'activity' ? (
              (visibleList as ActivityLog[]).map(a => (
                <tr key={a.id}>
                  <td data-label="Thời gian">{formatDate(a.created_at)}</td>
                  <td data-label="User">{a.username}</td>
                  <td data-label="Hành động"><span className={`${styles.actionBadge} ${styles[`action_${a.action}`] || ''}`}>{a.action}</span></td>
                  <td data-label="Chi tiết" className={styles.detailsCell}>{a.details || '-'}</td>
                  <td data-label="IP">{a.ip_address || '-'}</td>
                </tr>
              ))
            ) : (
              (visibleList as LoginRecord[]).map(l => (
                <tr key={l.id}>
                  <td data-label="Thời gian">{formatDate(l.created_at)}</td>
                  <td data-label="User">{l.username}</td>
                  <td data-label="IP">{l.ip_address || '-'}</td>
                  <td data-label="Device">{l.device || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {visibleCount < currentList.length && (
        <div className={styles.loadMore}>
          <button className={styles.loadMoreBtn} onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
            <ChevronDown size={15} /> Xem thêm ({visibleCount}/{currentList.length})
          </button>
        </div>
      )}

      {/* ── Chart: Hoạt Động 7 Ngày ── */}
      <div className={styles.sectionLabel} style={{ marginTop: 40 }}>
        <BarChart3 size={16} /> Biểu Đồ Hoạt Động
      </div>
      <div className={styles.graphSection}>
        <div className={styles.graphHeader}>
          <h3>Hoạt Động 7 Ngày Qua</h3>
          <Activity size={15} />
        </div>
        <div className={styles.barChart}>
          {activityByDay.map((item, idx) => (
            <div key={idx} className={styles.barCol}>
              <div className={styles.bar} style={{
                height: `${(item.count / maxActivity) * 85}%`,
                animationDelay: `${idx * 0.06}s`,
                background: 'linear-gradient(to top, #6f42c1, #0d6efd)',
              }}>
                <div className={styles.barTooltip}>{item.count} hoạt động</div>
              </div>
              <span className={styles.barLabel}>{item.dateLabel}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .${styles.bar} { animation: barGrow 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .dashHeader, .statCard, .graphSection, .sectionLabel, .tabBar, .filterRow, .adminTable tbody tr, .loadMore { opacity: 0; animation: fadeUp 0.5s ease both; }
        .statCard:nth-child(1) { animation-delay: 0.05s; }
        .statCard:nth-child(2) { animation-delay: 0.1s; }
        .statCard:nth-child(3) { animation-delay: 0.15s; }
        .statCard:nth-child(4) { animation-delay: 0.2s; }
        .graphSection:nth-of-type(1) { animation-delay: 0.15s; }
        .graphSection:nth-of-type(2) { animation-delay: 0.2s; }
        .sectionLabel { animation-delay: 0.1s; }
        .filterRow { animation-delay: 0.2s; }
        .tabBar { animation-delay: 0.25s; }
        .adminTable tbody tr { animation-delay: 0.3s; }
        .adminTable tbody tr:nth-child(1) { animation-delay: 0.3s; }
        .adminTable tbody tr:nth-child(2) { animation-delay: 0.33s; }
        .adminTable tbody tr:nth-child(3) { animation-delay: 0.36s; }
        .adminTable tbody tr:nth-child(4) { animation-delay: 0.39s; }
        .adminTable tbody tr:nth-child(5) { animation-delay: 0.42s; }
        .loadMore { animation-delay: 0.4s; }
        .dashHeader { animation-delay: 0s; }
        .${styles.skeleton} { background: linear-gradient(90deg, hsl(var(--bg-subtle)) 25%, hsl(var(--bg-card)) 50%, hsl(var(--bg-subtle)) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
      `}</style>
    </div>
  );
}
