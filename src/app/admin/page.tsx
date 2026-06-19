'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, Download, ArrowUpRight, Activity, Clock, Search, RefreshCw, ChevronDown, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

interface AppClickStat {
  name: string;
  count: number;
}

interface DailyVisitStat {
  dateLabel: string;
  count: number;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
  username?: string;
}

interface LoginRecord {
  id: string;
  user_id: string;
  ip_address: string;
  device: string;
  created_at: string;
  username?: string;
}

const ACTION_TYPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'create_account', label: 'Tạo tài khoản' },
  { value: 'login', label: 'Đăng nhập' },
  { value: 'update_user', label: 'Cập nhật người dùng' },
  { value: 'gift_purchase', label: 'Mua quà' },
  { value: 'download', label: 'Tải xuống' },
];

const PAGE_SIZE = 20;

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
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [filteredLogins, setFilteredLogins] = useState<LoginRecord[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState<'activity' | 'login'>('activity');

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [activityByDay, setActivityByDay] = useState<{ dateLabel: string; count: number }[]>([]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        totalVisitsRes,
        recentVisitsRes,
        totalDownloadsRes,
        recentDownloadsRes,
        visitsTimelineRes,
        totalUsersRes,
      ] = await Promise.all([
        supabase.from('analytics_visits').select('*', { count: 'exact', head: true }),
        supabase.from('analytics_visits').select('*', { count: 'exact', head: true }).gte('visited_at', thirtyDaysAgo),
        supabase.from('analytics_downloads').select('*', { count: 'exact', head: true }),
        supabase.from('analytics_downloads').select('app_id, apps(name)'),
        supabase.from('analytics_visits').select('visited_at').order('visited_at', { ascending: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      ]);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const logsRes = await fetch('/api/admin/logs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => r.json()).catch(() => ({ loginHistory: [], activityLogs: [] }));

      const allLogins = logsRes.loginHistory || [];
      const allActivities = logsRes.activityLogs || [];

      const todayLogins = allLogins.filter((l: any) => new Date(l.created_at) >= todayStart).length;
      const unique7dUsers = new Set(allLogins.filter((l: any) => new Date(l.created_at) >= new Date(sevenDaysAgo)).map((l: any) => l.user_id));
      const todayActivityCount = allActivities.filter((a: any) => new Date(a.created_at) >= todayStart).length;

      setTotalVisits(totalVisitsRes.count || 0);
      setTodayVisits(recentVisitsRes.count || 0);
      setTotalDownloads(totalDownloadsRes.count || 0);
      setTotalUsers(totalUsersRes.count || 0);
      setTodayLogins(todayLogins);
      setActiveUsers7d(unique7dUsers.size);

      if (recentDownloadsRes.data) {
        const aggMap: { [key: string]: number } = {};
        recentDownloadsRes.data.forEach((row: any) => {
          const appName = row.apps?.name || 'Ứng dụng không xác định';
          aggMap[appName] = (aggMap[appName] || 0) + 1;
        });
        setAppClicks(
          Object.keys(aggMap)
            .map((name) => ({ name, count: aggMap[name] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      }

      if (visitsTimelineRes.data) {
        const dailyMap: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dailyMap[d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })] = 0;
        }
        visitsTimelineRes.data.forEach((v: any) => {
          const dateStr = new Date(v.visited_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
          if (dailyMap[dateStr] !== undefined) dailyMap[dateStr]++;
        });
        setDailyVisits(Object.keys(dailyMap).map((dateLabel) => ({ dateLabel, count: dailyMap[dateLabel] })));
      }

      const acts = allActivities.map((a: any) => ({
        ...a,
        username: a.user_profiles?.username || a.user_email || 'N/A',
      }));
      const logins = allLogins.map((l: any) => ({
        ...l,
        username: l.user_profiles?.username || l.user_email || 'N/A',
      }));

      setActivities(acts);
      setLoginHistory(logins);

      const dailyActivityMap: { [key: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
        dailyActivityMap[key] = 0;
      }
      acts.forEach((a: ActivityLog) => {
        const dateStr = new Date(a.created_at).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
        if (dailyActivityMap[dateStr] !== undefined) dailyActivityMap[dateStr]++;
      });
      setActivityByDay(Object.keys(dailyActivityMap).map((dateLabel) => ({ dateLabel, count: dailyActivityMap[dateLabel] })));
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let result = [...activities];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) => a.username?.toLowerCase().includes(q) || a.action?.toLowerCase().includes(q)
      );
    }
    if (actionFilter !== 'all') {
      result = result.filter((a) => a.action === actionFilter);
    }
    if (dateFrom) {
      result = result.filter((a) => a.created_at?.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((a) => a.created_at?.slice(0, 10) <= dateTo);
    }
    setFilteredActivities(result);
    setVisibleCount(PAGE_SIZE);
  }, [activities, search, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    let result = [...loginHistory];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.username?.toLowerCase().includes(q) || l.ip_address?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) {
      result = result.filter((l) => l.created_at?.slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((l) => l.created_at?.slice(0, 10) <= dateTo);
    }
    setFilteredLogins(result);
  }, [loginHistory, search, dateFrom, dateTo]);

  const currentList = activeTab === 'activity' ? filteredActivities : filteredLogins;
  const visibleList = currentList.slice(0, visibleCount);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải số liệu thống kê...</p>
      </div>
    );
  }

  const maxVisitCount = Math.max(...dailyVisits.map((d) => d.count), 1);
  const maxAppClickCount = Math.max(...appClicks.map((a) => a.count), 1);
  const maxActivityDayCount = Math.max(...activityByDay.map((d) => d.count), 1);

  return (
    <div>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className={styles.pageTitle}>Thống Kê Tổng Quan</h1>
            <p className={styles.pageSubtitle}>Xem lưu lượng truy cập và hoạt động tải về trên toàn trang web</p>
          </div>
          <button
            onClick={fetchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'hsl(var(--text-primary))',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? styles.spinning : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards - Visit Stats */}
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flexWrap: 'wrap', marginBottom: '32px' }}>
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

      {/* Section 1: Tổng Quan Người Dùng */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tổng Quan Người Dùng</h1>
        <p className={styles.pageSubtitle}>Thống kê người dùng và hoạt động đăng nhập</p>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Tổng người dùng</span>
            <Users size={18} style={{ color: 'hsl(var(--color-primary))' }} />
          </div>
          <div className={styles.statValue}>{totalUsers.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Hôm nay đăng nhập</span>
            <ArrowUpRight size={18} style={{ color: 'hsl(var(--color-secondary))' }} />
          </div>
          <div className={styles.statValue}>{todayLogins.toLocaleString()}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Hoạt động 7 ngày</span>
            <Activity size={18} style={{ color: 'hsl(var(--color-accent))' }} />
          </div>
          <div className={styles.statValue}>{activeUsers7d.toLocaleString()}</div>
        </div>
      </div>

      {/* Section 2: Nhật Ký Hoạt Động */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Nhật Ký Hoạt Động</h1>
        <p className={styles.pageSubtitle}>Theo dõi hoạt động và lịch sử đăng nhập</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px', maxWidth: '360px' }}>
          <Search size={16} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Tìm theo user hoặc hành động..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              color: 'hsl(var(--text-primary))',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        {activeTab === 'activity' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-glass))',
                borderRadius: '8px',
                color: 'hsl(var(--text-primary))',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {ACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', whiteSpace: 'nowrap' }}>Từ</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              color: 'hsl(var(--text-primary))',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', whiteSpace: 'nowrap' }}>Đến</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              color: 'hsl(var(--text-primary))',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid hsl(var(--border-glass))', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('activity')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: activeTab === 'activity' ? 'hsla(var(--color-primary) / 0.08)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'activity' ? '2px solid hsl(var(--color-primary))' : '2px solid transparent',
            marginBottom: '-2px',
            borderRadius: '8px 8px 0 0',
            color: activeTab === 'activity' ? 'hsl(var(--color-primary))' : 'hsl(var(--text-secondary))',
            fontWeight: activeTab === 'activity' ? 600 : 400,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Activity size={16} />
          Hoạt động ({filteredActivities.length})
        </button>
        <button
          onClick={() => setActiveTab('login')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: activeTab === 'login' ? 'hsla(var(--color-primary) / 0.08)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'login' ? '2px solid hsl(var(--color-primary))' : '2px solid transparent',
            marginBottom: '-2px',
            borderRadius: '8px 8px 0 0',
            color: activeTab === 'login' ? 'hsl(var(--color-primary))' : 'hsl(var(--text-secondary))',
            fontWeight: activeTab === 'login' ? 600 : 400,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Clock size={16} />
          Đăng nhập ({filteredLogins.length})
        </button>
      </div>

      {/* Activity / Login Table */}
      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            {activeTab === 'activity' ? (
              <tr>
                <th>Thời gian</th>
                <th>User</th>
                <th>Hành động</th>
                <th>Chi tiết</th>
                <th>IP</th>
              </tr>
            ) : (
              <tr>
                <th>Thời gian</th>
                <th>User</th>
                <th>IP</th>
                <th>Device</th>
              </tr>
            )}
          </thead>
          <tbody>
            {visibleList.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'activity' ? 5 : 4} style={{ textAlign: 'center', padding: '40px 16px', color: 'hsl(var(--text-muted))' }}>
                  Không có dữ liệu
                </td>
              </tr>
            ) : activeTab === 'activity' ? (
              (visibleList as ActivityLog[]).map((a) => (
                <tr key={a.id}>
                  <td>{formatDate(a.created_at)}</td>
                  <td>{a.username}</td>
                  <td>{a.action}</td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.details || '-'}</td>
                  <td>{a.ip_address || '-'}</td>
                </tr>
              ))
            ) : (
              (visibleList as LoginRecord[]).map((l) => (
                <tr key={l.id}>
                  <td>{formatDate(l.created_at)}</td>
                  <td>{l.username}</td>
                  <td>{l.ip_address || '-'}</td>
                  <td>{l.device || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {visibleCount < currentList.length && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 24px',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-glass))',
              borderRadius: '8px',
              color: 'hsl(var(--color-primary))',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <ChevronDown size={16} />
            Xem thêm ({Math.min(visibleCount, currentList.length)} / {currentList.length})
          </button>
        </div>
      )}

      {/* Section 3: Biểu Đồ Hoạt Động */}
      <div style={{ marginTop: '32px' }}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Biểu Đồ Hoạt Động</h1>
          <p className={styles.pageSubtitle}>Số lượng hoạt động theo ngày trong 7 ngày qua</p>
        </div>
        <div className={styles.graphSection}>
          <div className={styles.graphHeader}>
            <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Hoạt Động 7 Ngày Qua</h3>
            <BarChart3 size={16} style={{ color: 'hsl(var(--text-muted))' }} />
          </div>
          <div className={styles.barChart}>
            {activityByDay.map((item, idx) => {
              const heightPercent = `${(item.count / maxActivityDayCount) * 85}%`;
              return (
                <div key={idx} className={styles.barCol}>
                  <div
                    className={styles.bar}
                    style={{
                      height: heightPercent,
                      background: 'linear-gradient(to top, hsl(var(--color-accent)), hsl(var(--color-primary)))',
                    }}
                  >
                    <div className={styles.barTooltip}>{item.count} hoạt động</div>
                  </div>
                  <span className={styles.barLabel}>{item.dateLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
