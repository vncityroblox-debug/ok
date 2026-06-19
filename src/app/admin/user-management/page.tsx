'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Search, RefreshCw, Eye, EyeOff, Shield, ShieldCheck,
  Mail, Phone, Clock, ShoppingCart, Key, ChevronDown, ChevronUp,
  X, Edit3, Gift, Activity, Ban, CheckCircle, ExternalLink,
} from 'lucide-react';
import styles from '../admin.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  total_purchases: number;
  last_login: string | null;
}

interface Purchase {
  id: string;
  user_id: string;
  item_type: string;
  item_name: string;
  key_code: string;
  created_at: string;
}

interface LoginHistory {
  id: string;
  user_id: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

// ─── Modal Overlay Style ─────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.2s ease',
};

const modalCardStyle: React.CSSProperties = {
  background: 'hsl(var(--bg-card))',
  border: '1px solid hsl(var(--border-glass))',
  borderRadius: '16px',
  padding: '28px',
  width: '90%',
  maxWidth: '560px',
  maxHeight: '85vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  animation: 'slideUp 0.25s ease',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '1px solid hsl(var(--border-glass))',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'hsl(var(--text-muted))',
  padding: '4px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'hsl(var(--bg-card))',
  border: '1px solid hsl(var(--border-glass))',
  padding: '10px 14px',
  borderRadius: '8px',
  color: 'hsl(var(--text-primary))',
  fontSize: '0.9rem',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  marginBottom: '6px',
  color: 'hsl(var(--text-primary))',
};

const btnPrimary: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px 20px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
  border: 'none',
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const PAGE_SIZE = 20;

// ─── Modal: User Detail ─────────────────────────────────────────────────────
function UserDetailModal({ user, onClose }: {
  user: UserProfile;
  onClose: () => void;
}) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const [purchasesRes, logsRes] = await Promise.all([
          supabase
            .from('purchases')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          fetch(`/api/admin/logs?user_id=${user.id}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }).then((r) => r.json()).catch(() => ({ loginHistory: [] })),
        ]);
        setPurchases(purchasesRes.data ?? []);
        setLoginHistory(logsRes.loginHistory ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalCardStyle, maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={20} style={{ color: 'hsl(var(--color-primary))' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Chi Tiết Người Dùng</h3>
          </div>
          <button style={closeBtnStyle} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <p>Đang tải...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Profile Info */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Thông Tin Cá Nhân
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> Email
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem', wordBreak: 'break-all' }}>{user.email}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}>Username</div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.username ?? '—'}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '4px' }}>Họ và Tên</div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.full_name ?? '—'}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> Số Điện Thoại
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.phone ?? '—'}</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Ngày Đăng Ký
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {new Date(user.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShoppingCart size={12} /> Tổng Mua Hàng
                  </div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.total_purchases}</div>
                </div>
              </div>
            </div>

            {/* Purchases */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Lịch Sử Mua Hàng ({purchases.length})
              </h4>
              {purchases.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', background: 'hsl(var(--bg-subtle))', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))' }}>
                  Chưa có giao dịch nào
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {purchases.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'hsl(var(--bg-subtle))',
                        border: '1px solid hsl(var(--border-glass))',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500 }}>{p.item_name}</span>
                        {p.key_code && (
                          <span style={{ marginLeft: '8px', color: 'hsl(var(--color-primary))', fontFamily: 'monospace' }}>
                            {p.key_code}
                          </span>
                        )}
                      </div>
                      <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {new Date(p.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Login History */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Lịch Sử Đăng Nhập ({loginHistory.length})
              </h4>
              {loginHistory.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', background: 'hsl(var(--bg-subtle))', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))' }}>
                  Chưa có lịch sử đăng nhập
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {loginHistory.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'hsl(var(--bg-subtle))',
                        border: '1px solid hsl(var(--border-glass))',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                        <span>{new Date(l.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                      {l.ip_address && (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
                          {l.ip_address}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal: Gift Key ─────────────────────────────────────────────────────────
function GiftKeyModal({ user, onClose, onSaved }: {
  user: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [itemType, setItemType] = useState<'app' | 'source_code'>('app');
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [keyCode, setKeyCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchItems = useCallback(async (type: 'app' | 'source_code') => {
    setLoadingItems(true);
    try {
      const table = type === 'app' ? 'apps' : 'source_codes';
      const { data } = await supabase.from(table).select('id, name').order('name');
      setItems(data ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(itemType);
  }, [itemType, fetchItems]);

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setKeyCode(result);
  };

  const handleGift = async () => {
    if (!selectedItemId) {
      setMsg({ type: 'error', text: 'Vui lòng chọn một mục.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/gift-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: user.id,
          item_type: itemType,
          item_id: selectedItemId,
          key_code: keyCode || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: json.error || 'Lỗi tặng key' });
      } else {
        setMsg({ type: 'success', text: 'Tặng key thành công!' });
        setKeyCode('');
        setSelectedItemId('');
        onSaved();
      }
    } catch {
      setMsg({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalCardStyle, maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gift size={20} style={{ color: '#f59e0b' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Tặng Key cho {user.email}</h3>
          </div>
          <button style={closeBtnStyle} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Loại Sản Phẩm</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 'app' as const, label: '📱 Ứng Dụng' },
                { value: 'source_code' as const, label: '💻 Mã Nguồn' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setItemType(opt.value); setSelectedItemId(''); }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: `2px solid ${itemType === opt.value ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                    background: itemType === opt.value ? 'rgba(139,92,246,0.1)' : 'transparent',
                    color: 'hsl(var(--text-primary))',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Chọn Sản Phẩm</label>
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              <option value="">
                {loadingItems ? 'Đang tải...' : '-- Chọn sản phẩm --'}
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Mã Key</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={keyCode}
                onChange={(e) => setKeyCode(e.target.value)}
                placeholder="Nhập hoặc tự động tạo"
              />
              <button
                onClick={generateKey}
                style={{
                  ...btnPrimary,
                  padding: '10px 14px',
                  flexShrink: 0,
                }}
              >
                <Key size={14} />
                Tạo Key
              </button>
            </div>
          </div>

          {msg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '8px',
              background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: msg.type === 'success' ? '#10b981' : '#ef4444',
              fontSize: '0.85rem',
            }}>
              {msg.type === 'success' ? <CheckCircle size={16} /> : <Ban size={16} />}
              {msg.text}
            </div>
          )}

          <button
            style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
            onClick={handleGift}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Đang gửi...
              </>
            ) : (
              <>
                <Gift size={16} />
                Tặng Key
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'has_purchases' | 'no_purchases'>('all');

  const [detailUser, setDetailUser] = useState<UserProfile | null>(null);
  const [giftUser, setGiftUser] = useState<UserProfile | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const [profilesRes, purchasesRes, logsRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('purchases')
          .select('id, user_id'),
        fetch('/api/admin/logs', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then((r) => r.json()).catch(() => ({ loginHistory: [] })),
      ]);

      if (profilesRes.error) {
        setError(profilesRes.error.message);
        return;
      }

      const purchaseCountMap = new Map<string, number>();
      (purchasesRes.data ?? []).forEach((p: any) => {
        purchaseCountMap.set(p.user_id, (purchaseCountMap.get(p.user_id) ?? 0) + 1);
      });

      const lastLoginMap = new Map<string, string>();
      (logsRes.loginHistory ?? []).forEach((l: any) => {
        if (!lastLoginMap.has(l.user_id)) {
          lastLoginMap.set(l.user_id, l.created_at);
        }
      });

      const merged: UserProfile[] = (profilesRes.data ?? []).map((p: any) => ({
        ...p,
        total_purchases: purchaseCountMap.get(p.id) ?? 0,
        last_login: lastLoginMap.get(p.id) ?? null,
      }));

      setAllUsers(merged);
      setDisplayCount(PAGE_SIZE);
    } catch {
      setError('Không kết nối được server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = allUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q);

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'has_purchases' && u.total_purchases > 0) ||
      (filterType === 'no_purchases' && u.total_purchases === 0);

    return matchesSearch && matchesFilter;
  });

  const visibleUsers = filteredUsers.slice(0, displayCount);
  const hasMore = displayCount < filteredUsers.length;

  const totalPurchases = allUsers.reduce((sum, u) => sum + u.total_purchases, 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRegistrations = allUsers.filter(
    (u) => new Date(u.created_at) >= todayStart
  ).length;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeUserIds = new Set<string>();
  (allUsers.forEach((u) => {
    if (u.last_login && new Date(u.last_login) >= sevenDaysAgo) {
      activeUserIds.add(u.id);
    }
  }));
  const activeCount = activeUserIds.size;

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Quản Lý Người Dùng</h1>
        <p className={styles.pageSubtitle}>
          Xem và quản lý tất cả người dùng thường (không phải admin)
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Tổng Người Dùng</span>
            <Users size={20} style={{ color: 'hsl(var(--color-primary))' }} />
          </div>
          <div className={styles.statValue}>{allUsers.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Hôm Nay Đăng Ký</span>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </div>
          <div className={styles.statValue}>{todayRegistrations}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Tổng Mua Hàng</span>
            <ShoppingCart size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div className={styles.statValue}>{totalPurchases}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span>Đang Hoạt Động (7 ngày)</span>
            <Activity size={20} style={{ color: '#10b981' }} />
          </div>
          <div className={styles.statValue}>{activeCount}</div>
        </div>
      </div>

      {/* Toolbar: Search + Filter + Refresh */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '200px' }}>
          <Search size={16} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'hsl(var(--text-muted))',
          }} />
          <input
            className={styles.formInput}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setDisplayCount(PAGE_SIZE); }}
            placeholder="Tìm theo email, username, họ tên..."
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'all' as const, label: 'Tất Cả' },
            { value: 'has_purchases' as const, label: 'Đã Mua' },
            { value: 'no_purchases' as const, label: 'Chưa Mua' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilterType(opt.value); setDisplayCount(PAGE_SIZE); }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${filterType === opt.value ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                background: filterType === opt.value ? 'rgba(139,92,246,0.1)' : 'hsl(var(--bg-card))',
                color: filterType === opt.value ? 'hsl(var(--color-primary))' : 'hsl(var(--text-secondary))',
                fontWeight: 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: 'hsl(var(--color-primary))',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '16px', borderRadius: '12px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'hsl(var(--text-muted))' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Đang tải danh sách người dùng...</p>
        </div>
      ) : visibleUsers.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-glass))',
          borderRadius: '16px', color: 'hsl(var(--text-muted))',
        }}>
          <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>{searchQuery || filterType !== 'all' ? 'Không tìm thấy người dùng phù hợp.' : 'Chưa có người dùng nào.'}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Họ Tên</th>
                <th>Số Điện Thoại</th>
                <th>Ngày Đăng Ký</th>
                <th>Lần Đăng Nhập Cuối</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                      }}>
                        {u.username?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.email}</div>
                        {u.username && (
                          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>@{u.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{u.full_name ?? '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.phone ?? '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>
                    {new Date(u.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>
                    {u.last_login
                      ? new Date(u.last_login).toLocaleString('vi-VN')
                      : '—'}
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        title="Xem chi tiết"
                        onClick={() => setDetailUser(u)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        title="Tặng Key"
                        onClick={() => setGiftUser(u)}
                        style={{ color: '#f59e0b' }}
                      >
                        <Gift size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
            style={{
              padding: '10px 28px',
              borderRadius: '10px',
              border: '1px solid hsl(var(--border-glass))',
              background: 'hsl(var(--bg-card))',
              color: 'hsl(var(--text-primary))',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ChevronDown size={16} />
            Xem thêm ({filteredUsers.length - displayCount} còn lại)
          </button>
        </div>
      )}

      {/* Modals */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
        />
      )}

      {giftUser && (
        <GiftKeyModal
          user={giftUser}
          onClose={() => setGiftUser(null)}
          onSaved={fetchData}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
