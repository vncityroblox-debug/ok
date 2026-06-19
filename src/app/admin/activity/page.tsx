'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Users, RefreshCw, Filter, Search, Clock, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from '../admin.module.css'

interface ActivityLog {
  id: string
  user_id: string
  action: string
  details: string
  ip_address: string
  created_at: string
  username?: string
}

interface LoginRecord {
  id: string
  user_id: string
  ip_address: string
  device: string
  created_at: string
  username?: string
}

const ACTION_TYPES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'create_account', label: 'Tạo tài khoản' },
  { value: 'login', label: 'Đăng nhập' },
  { value: 'update_user', label: 'Cập nhật người dùng' },
  { value: 'gift_purchase', label: 'Mua quà' },
  { value: 'download', label: 'Tải xuống' },
  { value: 'view', label: 'Xem' },
]

const PAGE_SIZE = 50

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState<'activity' | 'login'>('activity')
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([])
  const [filteredLogins, setFilteredLogins] = useState<LoginRecord[]>([])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [totalActivities, setTotalActivities] = useState(0)
  const [todayActivities, setTodayActivities] = useState(0)
  const [todayUniqueUsers, setTodayUniqueUsers] = useState(0)
  const [totalLogins, setTotalLogins] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const logsRes = await fetch('/api/admin/logs').then((r) => r.json()).catch(() => ({ loginHistory: [], activityLogs: [] }))

      const acts = (logsRes.activityLogs || []).map((a: any) => ({
        ...a,
        username: a.user_profiles?.username || a.user_email || 'N/A',
      }))
      const logins = (logsRes.loginHistory || []).map((l: any) => ({
        ...l,
        username: l.user_profiles?.username || l.user_email || 'N/A',
      }))

      setActivities(acts)
      setLoginHistory(logins)

      const today = new Date().toISOString().split('T')[0]
      const todayActs = acts.filter((a: ActivityLog) => a.created_at?.startsWith(today))
      const uniqueToday = new Set(todayActs.map((a: ActivityLog) => a.user_id))

      setTotalActivities(acts.length)
      setTodayActivities(todayActs.length)
      setTodayUniqueUsers(uniqueToday.size)
      setTotalLogins(logins.length)
    } catch (err) {
      console.error('Failed to fetch activity data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    let result = [...activities]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.username?.toLowerCase().includes(q) ||
          a.action?.toLowerCase().includes(q)
      )
    }

    if (actionFilter !== 'all') {
      result = result.filter((a) => a.action === actionFilter)
    }

    if (dateFrom) {
      result = result.filter((a) => a.created_at?.slice(0, 10) >= dateFrom)
    }

    if (dateTo) {
      result = result.filter((a) => a.created_at?.slice(0, 10) <= dateTo)
    }

    setFilteredActivities(result)
    setVisibleCount(PAGE_SIZE)
  }, [activities, search, actionFilter, dateFrom, dateTo])

  useEffect(() => {
    let result = [...loginHistory]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.username?.toLowerCase().includes(q) ||
          l.ip_address?.toLowerCase().includes(q)
      )
    }

    if (dateFrom) {
      result = result.filter((l) => l.created_at?.slice(0, 10) >= dateFrom)
    }

    if (dateTo) {
      result = result.filter((l) => l.created_at?.slice(0, 10) <= dateTo)
    }

    setFilteredLogins(result)
  }, [loginHistory, search, dateFrom, dateTo])

  const currentList = activeTab === 'activity' ? filteredActivities : filteredLogins
  const visibleList = currentList.slice(0, visibleCount)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>
          <Activity size={24} />
          Nhật ký hoạt động
        </h1>
        <button onClick={fetchData} className={styles.refreshBtn} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          Làm mới
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Activity size={20} />
          <div>
            <span className={styles.statValue}>{totalActivities}</span>
            <span className={styles.statLabel}>Tổng hoạt động</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Clock size={20} />
          <div>
            <span className={styles.statValue}>{todayActivities}</span>
            <span className={styles.statLabel}>Hôm nay</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Users size={20} />
          <div>
            <span className={styles.statValue}>{todayUniqueUsers}</span>
            <span className={styles.statLabel}>User hoạt động hôm nay</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Activity size={20} />
          <div>
            <span className={styles.statValue}>{totalLogins}</span>
            <span className={styles.statLabel}>Tổng lần đăng nhập</span>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo user hoặc hành động..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeTab === 'activity' && (
          <div className={styles.filterGroup}>
            <Filter size={16} />
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              {ACTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.filterGroup}>
          <label>Từ</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Đến</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'activity' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={16} />
          Hoạt động ({filteredActivities.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'login' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('login')}
        >
          <Users size={16} />
          Lịch sử đăng nhập ({filteredLogins.length})
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
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
                    <td colSpan={activeTab === 'activity' ? 5 : 4} className={styles.emptyState}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : activeTab === 'activity' ? (
                  (visibleList as ActivityLog[]).map((a) => (
                    <tr key={a.id}>
                      <td>{formatDate(a.created_at)}</td>
                      <td>{a.username}</td>
                      <td>{a.action}</td>
                      <td className={styles.detailsCell}>{a.details || '-'}</td>
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
            <div className={styles.loadMore}>
              <button onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                <ChevronDown size={16} />
                Xem thêm ({visibleCount} / {currentList.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
