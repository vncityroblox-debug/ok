'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3, Users, Download, Eye, Activity, Clock, Search, RefreshCw,
  ChevronDown, Filter, MousePointerClick, UserPlus, TrendingUp,
  AppWindow, KeyRound, FileText, ShieldCheck, Plus, ExternalLink,
} from 'lucide-react';
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

const PAGE_SIZE = 15;

const QUICK_ACTIONS = [
  { name: 'Thêm Ứng Dụng', path: '/admin/apps', icon: AppWindow, color: '#3b82f6' },
  { name: 'Quản Lý Key', path: '/admin/keys', icon: KeyRound, color: '#8b5cf6' },
  { name: 'Viết Blog', path: '/admin/posts', icon: FileText, color: '#10b981' },
  { name: 'Xác Thực Zalo', path: '/admin/zalo-verification', icon: ShieldCheck, color: '#f59e0b' },
];

function Skeleton({ h = 20, w = '100%', delay = 0 }: { h?: number; w?: string | number; delay?: number }) {
  return (
    <div className={styles.skeleton} style={{ height: h, width: typeof w === 'number' ? w : w, animationDelay: `${delay}s` }} />
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
  const [verifiedUsers, setVerifiedUsers] = useState(0);
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

  const formatDate = (s: string) => s ? new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoaded(false);
    try {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [statsRes, logsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/logs'),
        fetch('/api/admin/zalo-verifications'),
      ]);
      const s = await statsRes.json().catch(() => ({}));
      const l = await logsRes.json().catch(() => ({ loginHistory: [], activityLogs: [] }));
      const u = await usersRes.json().catch(() => ({ users: [] }));

      const allLogins = l.loginHistory || [];
      const allActivities = l.activityLogs || [];
      setTotalVisits(s.totalVisits ?? 0);
      setTodayVisits(s.recentVisits ?? 0);
      setTotalDownloads(s.totalDownloads ?? 0);
      setTotalUsers(s.totalUsers ?? 0);
      setVerifiedUsers((u.users || []).filter((x: any) => x.is_verified).length);
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
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, actionFilter, dateFrom, dateTo]);

  const filteredActivities = activities.filter(a => {
    if (search) { const q = search.toLowerCase(); if (!(a.username || '').toLowerCase().includes(q) && !(a.action || '').toLowerCase().includes(q)) return false; }
    if (actionFilter !== 'all' && a.action !== actionFilter) return false;
    if (dateFrom && a.created_at?.slice(0, 10) < dateFrom) return false;
    if (dateTo && a.created_at?.slice(0, 10) > dateTo) return false;
    return true;
  });

  const filteredLogins = loginHistory.filter(l => {
    if (search) { const q = search.toLowerCase(); if (!(l.username || '').toLowerCase().includes(q) && !(l.ip_address || '').toLowerCase().includes(q)) return false; }
    if (dateFrom && l.created_at?.slice(0, 10) < dateFrom) return false;
    if (dateTo && l.created_at?.slice(0, 10) > dateTo) return false;
    return true;
  });

  const currentList = activeTab === 'activity' ? filteredActivities : filteredLogins;
  const visibleList = currentList.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.dashHeader}><div><Skeleton h={28} w={280} /><Skeleton h={16} w={200} delay={0.1} /></div></div>
        <div className={styles.statsGrid}>{[1, 2, 3, 4].map(i => <div key={i} className={styles.statCard}><Skeleton h={14} w="60%" delay={i * 0.05} /><Skeleton h={32} w="40%" delay={i * 0.08} /></div>)}</div>
      </div>
    );
  }

  const maxVisit = Math.max(...dailyVisits.map(d => d.count), 1);
  const maxClick = Math.max(...appClicks.map(a => a.count), 1);
  const maxActivity = Math.max(...activityByDay.map(d => d.count), 1);

  return (
    <div className={`${styles.dashboard} ${loaded ? styles.loaded : ''}`}>

      {/* Header */}
      <div className={styles.dashHeader}>
        <div className={styles.dashHeaderLeft}>
          <h1 className={styles.pageTitle}>Tổng Quan</h1>
          <p className={styles.pageSubtitle}>Bảng điều khiển quản trị</p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchData}>
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* Quick Actions */}
      <div className={styles.sectionLabel}>
        <Plus size={16} /> Thao Tác Nhanh
      </div>
      <div className={styles.quickActionsGrid}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.path} href={action.path} className={styles.quickActionCard}>
              <div className={styles.quickActionIcon} style={{ background: `${action.color}15`, color: action.color }}>
                <Icon size={22} />
              </div>
              <span className={styles.quickActionName}>{action.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Traffic Stats */}
      <div className={styles.sectionLabel}>
        <Eye size={16} /> Lưu Lượng Truy Cập
      </div>
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(13,110,253,0.1)', color: '#0d6efd' }}><Eye size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Tổng truy cập</span>
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

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.graphSection}>
          <div className={styles.graphHeader}><h3>Truy Cập 7 Ngày</h3><Eye size={15} /></div>
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
          <div className={styles.graphHeader}><h3>Tải Nhiều Nhất</h3><MousePointerClick size={15} /></div>
          {appClicks.length === 0 ? (
            <div className={styles.emptyChart}>Chưa có lượt tải nào</div>
          ) : (
            <div className={styles.barChart}>
              {appClicks.map((item, idx) => (
                <div key={idx} className={styles.barCol}>
                  <div className={styles.bar} style={{ height: `${(item.count / maxClick) * 85}%`, animationDelay: `${idx * 0.06}s`, background: 'linear-gradient(to top, #6f42c1, #0d6efd)' }}>
                    <div className={styles.barTooltip}>{item.count} lượt</div>
                  </div>
                  <span className={styles.barLabel} title={item.name}>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Stats */}
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
            <span className={styles.statLabel}>Đăng nhập hôm nay</span>
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
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><ShieldCheck size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Đã xác thực Zalo</span>
            <span className={styles.statValue}>{verifiedUsers.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className={styles.sectionLabel}>
        <Activity size={16} /> Nhật Ký Hoạt Động
      </div>

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

      {/* Activity Chart */}
      <div className={styles.sectionLabel} style={{ marginTop: 40 }}>
        <BarChart3 size={16} /> Biểu Đồ Hoạt Động
      </div>
      <div className={styles.graphSection}>
        <div className={styles.graphHeader}><h3>Hoạt Động 7 Ngày Qua</h3><Activity size={15} /></div>
        <div className={styles.barChart}>
          {activityByDay.map((item, idx) => (
            <div key={idx} className={styles.barCol}>
              <div className={styles.bar} style={{ height: `${(item.count / maxActivity) * 85}%`, animationDelay: `${idx * 0.06}s`, background: 'linear-gradient(to top, #6f42c1, #0d6efd)' }}>
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
        .${styles.skeleton} { background: linear-gradient(90deg, hsl(var(--bg-subtle)) 25%, hsl(var(--bg-card)) 50%, hsl(var(--bg-subtle)) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
      `}</style>
    </div>
  );
}
