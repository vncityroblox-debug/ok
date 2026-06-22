'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ShieldCheck, ShieldOff, Search, RefreshCw, Users, CheckCircle,
  XCircle, ExternalLink, Eye, X, Clock, ChevronDown, Filter,
} from 'lucide-react';
import styles from '../admin.module.css';

interface ZaloUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  created_at: string;
  zalo: {
    zalo_id: string;
    display_name: string;
    avatar_url: string;
    verification_code: string;
    verified_at: string;
  } | null;
}

const PAGE_SIZE = 20;

export default function ZaloVerificationPage() {
  const [users, setUsers] = useState<ZaloUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'verified' | 'unverified'>('all');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [detailUser, setDetailUser] = useState<ZaloUser | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/zalo-verifications', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Lỗi tải dữ liệu');
        return;
      }
      setUsers(json.users || []);
      setDisplayCount(PAGE_SIZE);
    } catch {
      setError('Không kết nối được server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q);
    const matchFilter = filterType === 'all' || (filterType === 'verified' && u.is_verified) || (filterType === 'unverified' && !u.is_verified);
    return matchSearch && matchFilter;
  });

  const visibleUsers = filteredUsers.slice(0, displayCount);
  const verifiedCount = users.filter(u => u.is_verified).length;
  const unverifiedCount = users.length - verifiedCount;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Xác Thực Zalo</h1>
        <p className={styles.pageSubtitle}>Quản lý trạng thái xác thực tài khoản người dùng qua Zalo Bot</p>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(13,110,253,0.1)', color: '#0d6efd' }}><Users size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Tổng người dùng</span>
            <span className={styles.statValue}>{users.length}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Đã xác thực</span>
            <span className={styles.statValue}>{verifiedCount}</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statsCard}`}>
          <div className={styles.statIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><XCircle size={20} /></div>
          <div className={styles.statBody}>
            <span className={styles.statLabel}>Chưa xác thực</span>
            <span className={styles.statValue}>{unverifiedCount}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
          <input className={styles.formInput} value={search} onChange={e => { setSearch(e.target.value); setDisplayCount(PAGE_SIZE); }} placeholder="Tìm theo username, email..." style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'all' as const, label: 'Tất Cả' },
            { value: 'verified' as const, label: 'Đã Xác Thực' },
            { value: 'unverified' as const, label: 'Chưa Xác Thực' },
          ].map(opt => (
            <button key={opt.value} onClick={() => { setFilterType(opt.value); setDisplayCount(PAGE_SIZE); }}
              style={{
                padding: '8px 14px', borderRadius: '8px',
                border: `1px solid ${filterType === opt.value ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                background: filterType === opt.value ? 'rgba(139,92,246,0.1)' : 'hsl(var(--bg-card))',
                color: filterType === opt.value ? 'hsl(var(--color-primary))' : 'hsl(var(--text-secondary))',
                fontWeight: 500, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >{opt.label}</button>
          ))}
        </div>
        <button onClick={fetchData} disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
            color: 'hsl(var(--color-primary))', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Làm mới
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'hsl(var(--text-muted))' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Đang tải...</p>
        </div>
      ) : visibleUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-glass))', borderRadius: '16px', color: 'hsl(var(--text-muted))' }}>
          <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>{search || filterType !== 'all' ? 'Không tìm thấy người dùng phù hợp.' : 'Chưa có người dùng nào.'}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Họ Tên</th>
                <th>Trạng Thái</th>
                <th>Zalo ID</th>
                <th>Tên Zalo</th>
                <th>Ngày Xác Thực</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: u.is_verified ? 'linear-gradient(135deg, #10b981, #3b82f6)' : 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                        border: u.is_verified ? '2px solid #10b981' : 'none',
                      }}>
                        {u.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {u.email}
                          {u.is_verified && <span className="verifiedBadge" style={{ padding: '1px 5px', fontSize: '0.6rem' }}><CheckCircle size={10} strokeWidth={2.5} /></span>}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{u.full_name || '—'}</td>
                  <td>
                    {u.is_verified ? (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Đã Xác Thực</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>Chưa Xác Thực</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{u.zalo?.zalo_id || '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.zalo?.display_name || '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>
                    {u.zalo?.verified_at ? new Date(u.zalo.verified_at).toLocaleString('vi-VN') : '—'}
                  </td>
                  <td>
                    <button className={`${styles.actionBtn} ${styles.editBtn}`} title="Xem chi tiết" onClick={() => setDetailUser(u)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {displayCount < filteredUsers.length && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => setDisplayCount(c => c + PAGE_SIZE)}
            style={{
              padding: '10px 28px', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))',
              background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-primary))', fontWeight: 600, fontSize: '0.9rem',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            <ChevronDown size={16} /> Xem thêm ({filteredUsers.length - displayCount} còn lại)
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setDetailUser(null)}>
          <div style={{
            background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-glass))', borderRadius: '16px',
            padding: '28px', width: '90%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border-glass))' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'hsl(var(--color-primary))' }} />
                Chi Tiết Xác Thực
              </h3>
              <button onClick={() => setDetailUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: '4px', borderRadius: '6px' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Thông Tin Tài Khoản</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Username</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>@{detailUser.username}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Email</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{detailUser.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Trạng thái</span>
                    {detailUser.is_verified ? (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Đã Xác Thực</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>Chưa Xác Thực</span>
                    )}
                  </div>
                </div>
              </div>

              {detailUser.zalo && (
                <div style={{ padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Thông Tin Zalo</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Zalo ID</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>{detailUser.zalo.zalo_id}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Tên Zalo</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{detailUser.zalo.display_name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Mã Xác Thực</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'monospace', color: 'hsl(var(--color-primary))', letterSpacing: '2px' }}>{detailUser.zalo.verification_code}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Ngày Xác Thực</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{new Date(detailUser.zalo.verified_at).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {!detailUser.zalo && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', background: 'hsl(var(--bg-subtle))', borderRadius: '12px', border: '1px solid hsl(var(--border-glass))' }}>
                  Người dùng chưa liên kết Zalo
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
