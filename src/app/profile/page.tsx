'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Clock, ShoppingCart, Download, Edit3, Save, X, ChevronDown, ChevronUp, Key } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/components/AuthGuard';
import { supabase } from '@/lib/supabase';

type Tab = 'profile' | 'history' | 'purchases' | 'keys';

interface LoginHistory {
  id: string;
  ip_address: string;
  device: string;
  created_at: string;
}

interface Purchase {
  id: string;
  item_name: string;
  item_type: 'app' | 'source_code';
  status: string;
  download_url: string | null;
  key_code: string | null;
  created_at: string;
}

function parseDevice(ua: string): string {
  if (!ua) return 'Không rõ';
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    if (/android/i.test(ua)) return 'Android';
    if (/iphone/i.test(ua)) return 'iPhone';
    if (/ipad/i.test(ua)) return 'iPad';
    return 'Di động';
  }
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  return 'Trình duyệt khác';
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    }
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user || activeTab !== 'history') return;
    setLoadingHistory(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      fetch('/api/auth/login-history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((data) => setLoginHistory(data.history || []))
        .catch(() => setLoginHistory([]))
        .finally(() => setLoadingHistory(false));
    });
  }, [user, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'purchases' && activeTab !== 'keys') return;
    setLoadingPurchases(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      fetch('/api/auth/purchases', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => r.json())
        .then((data) => setPurchases(data.purchases || []))
        .catch(() => setPurchases([]))
        .finally(() => setLoadingPurchases(false));
    });
  }, [user, activeTab]);

  const giftedKeys = purchases.filter((p) => p.key_code && p.key_code.trim() !== '');
  const downloadHistory = purchases.filter((p) => !p.key_code || p.key_code.trim() === '');

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ full_name: fullName, phone, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg({ type: 'error', text: data.error || 'Cập nhật thất bại.' });
        return;
      }
      if (email !== user?.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) {
          setSaveMsg({ type: 'error', text: 'Cập nhật thông tin thành công nhưng thay đổi email thất bại.' });
          return;
        }
      }
      await refreshProfile();
      setSaveMsg({ type: 'success', text: 'Cập nhật thành công!' });
    } catch {
      setSaveMsg({ type: 'error', text: 'Lỗi kết nối server.' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container">
        <Breadcrumbs />
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'hsl(var(--text-muted))' }}>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <Breadcrumbs />
        <section style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '48px 32px', textAlign: 'center', borderRadius: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'hsla(var(--color-primary) / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <User size={30} style={{ color: 'hsl(var(--color-primary))' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Bạn chưa đăng nhập</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '28px' }}>Vui lòng đăng nhập để xem hồ sơ cá nhân.</p>
            <Link href="/dang-nhap" className="neon-btn" style={{ justifyContent: 'center', padding: '12px 32px' }}>
              Đăng Nhập
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Thông Tin Cá Nhân', icon: <User size={16} /> },
    { key: 'history', label: 'Lịch Sử Đăng Nhập', icon: <Clock size={16} /> },
    { key: 'purchases', label: 'Lịch Sử Mua Hàng', icon: <ShoppingCart size={16} /> },
    { key: 'keys', label: 'Key Đã Tặng', icon: <Key size={16} /> },
  ];

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'hsl(var(--text-secondary))',
    marginBottom: '6px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid hsl(var(--border-glass))',
    background: 'hsl(var(--bg-card))',
    borderRadius: '10px',
    color: 'hsl(var(--text-primary))',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const readonlyInputStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'hsl(var(--bg-subtle))',
    color: 'hsl(var(--text-muted))',
    cursor: 'not-allowed',
  };

  return (
    <div className="container">
      <Breadcrumbs />
      <section style={{ padding: '32px 0 60px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'hsla(var(--color-primary) / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} style={{ color: 'hsl(var(--color-primary))' }} />
            </div>
            Hồ Sơ Cá Nhân
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>Quản lý thông tin và lịch sử hoạt động của bạn</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1.5px solid',
                borderColor: activeTab === tab.key ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))',
                background: activeTab === tab.key ? 'hsl(var(--color-primary))' : 'hsl(var(--bg-card))',
                color: activeTab === tab.key ? '#fff' : 'hsl(var(--text-secondary))',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>

          {/* Tab 1: Personal Info */}
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                Chỉnh Sửa Thông Tin
              </h2>

              <div style={{ display: 'grid', gap: '18px' }}>
                <div>
                  <label style={labelStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} /> Email
                    </span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--color-primary))'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border-glass))'; }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Tên Tài Khoản</label>
                  <input type="text" value={user.user_metadata?.username || profile?.username || ''} style={readonlyInputStyle} readOnly />
                </div>

                <div>
                  <label style={labelStyle}>Họ Tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ tên..."
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--color-primary))'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border-glass))'; }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} /> Số Điện Thoại
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--color-primary))'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border-glass))'; }}
                  />
                </div>
              </div>

              {saveMsg && (
                <div style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: saveMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${saveMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: saveMsg.type === 'success' ? '#16a34a' : '#ef4444',
                  fontSize: '0.9rem',
                }}>
                  {saveMsg.text}
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="neon-btn"
                  style={{
                    gap: '8px',
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? (
                    <>
                      <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Lưu Thay Đổi
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Login History */}
          {activeTab === 'history' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                Lịch Sử Đăng Nhập
              </h2>

              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  <p>Đang tải lịch sử...</p>
                </div>
              ) : loginHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  <Clock size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p>Chưa có lịch sử đăng nhập.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời Gian</th>
                        <th style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>IP</th>
                        <th style={{ padding: '8px 16px', fontWeight: 600, fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Device</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((item) => (
                        <tr key={item.id} style={{ background: 'hsl(var(--bg-card))', borderRadius: '12px', boxShadow: 'var(--shadow-card)' }}>
                          <td style={{ padding: '14px 16px', fontSize: '0.9rem', borderTop: '1px solid hsl(var(--border-glass))', borderBottom: '1px solid hsl(var(--border-glass))', borderLeft: '1px solid hsl(var(--border-glass))', borderRadius: '12px 0 0 12px' }}>
                            {new Date(item.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.9rem', borderTop: '1px solid hsl(var(--border-glass))', borderBottom: '1px solid hsl(var(--border-glass))', fontFamily: 'monospace' }}>
                            {item.ip_address || 'N/A'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.9rem', borderTop: '1px solid hsl(var(--border-glass))', borderBottom: '1px solid hsl(var(--border-glass))', borderRight: '1px solid hsl(var(--border-glass))', borderRadius: '0 12px 12px 0' }}>
                            {parseDevice(item.device || '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Purchases */}
          {activeTab === 'purchases' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                Lịch Sử Mua Hàng & Tải Về
              </h2>

              {loadingPurchases ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : downloadHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  <ShoppingCart size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p>Chưa có lịch sử mua hàng.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {downloadHistory.map((item) => {
                    const isExpanded = expandedPurchase === item.id;
                    return (
                      <div
                        key={item.id}
                        style={{
                          border: '1px solid hsl(var(--border-glass))',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          transition: 'box-shadow 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-neon-strong)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 20px',
                            cursor: 'pointer',
                            background: 'hsl(var(--bg-card))',
                            gap: '12px',
                            flexWrap: 'wrap',
                          }}
                          onClick={() => setExpandedPurchase(isExpanded ? null : item.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '10px',
                              background: item.item_type === 'app' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              {item.item_type === 'app' ? <ShoppingCart size={18} style={{ color: '#3b82f6' }} /> : <Download size={18} style={{ color: '#8b5cf6' }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                                  background: item.item_type === 'app' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                                  color: item.item_type === 'app' ? '#3b82f6' : '#8b5cf6',
                                }}>
                                  {item.item_type === 'app' ? 'Ứng Dụng' : 'Mã Nguồn'}
                                </span>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                                  background: item.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                  color: item.status === 'completed' ? '#16a34a' : '#b8860b',
                                }}>
                                  {item.status === 'completed' ? 'Thành công' : item.status}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
                                  {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={18} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} /> : <ChevronDown size={18} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />}
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '0 20px 16px', borderTop: '1px solid hsl(var(--border-glass))', background: 'hsl(var(--bg-subtle))' }}>
                            <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {item.key_code && (
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Mã Key</div>
                                  <div style={{
                                    fontFamily: "'Courier New', monospace",
                                    fontSize: '0.9rem',
                                    padding: '10px 14px',
                                    background: 'hsl(var(--bg-card))',
                                    border: '1px solid hsl(var(--border-glass))',
                                    borderRadius: '8px',
                                    letterSpacing: '1.5px',
                                    wordBreak: 'break-all',
                                  }}>
                                    {item.key_code}
                                  </div>
                                </div>
                              )}
                              {item.download_url && (
                                <a
                                  href={item.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="neon-btn"
                                  style={{ justifyContent: 'center', textDecoration: 'none', gap: '8px', width: 'fit-content' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download size={16} />
                                  Tải Về
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Gifted Keys */}
          {activeTab === 'keys' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                Key Đã Được Tặng
              </h2>

              {loadingPurchases ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : giftedKeys.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  <Key size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p>Bạn chưa có key nào được tặng.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {giftedKeys.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: '1px solid hsl(var(--border-glass))',
                        borderRadius: '12px',
                        padding: '18px 20px',
                        background: 'hsl(var(--bg-card))',
                        transition: 'box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-neon-strong)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            background: item.item_type === 'app' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {item.item_type === 'app' ? <ShoppingCart size={16} style={{ color: '#3b82f6' }} /> : <Download size={16} style={{ color: '#8b5cf6' }} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.item_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                              {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600,
                          background: item.item_type === 'app' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                          color: item.item_type === 'app' ? '#3b82f6' : '#8b5cf6',
                        }}>
                          {item.item_type === 'app' ? 'Ứng Dụng' : 'Mã Nguồn'}
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Mã Key</div>
                        <div style={{
                          fontFamily: "'Courier New', monospace",
                          fontSize: '1rem',
                          fontWeight: 700,
                          padding: '12px 16px',
                          background: 'hsla(var(--color-primary) / 0.06)',
                          border: '1.5px dashed hsla(var(--color-primary) / 0.3)',
                          borderRadius: '10px',
                          letterSpacing: '2px',
                          wordBreak: 'break-all',
                          color: 'hsl(var(--color-primary))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}>
                          <span>{item.key_code}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.key_code || '');
                            }}
                            style={{
                              padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                              background: 'hsl(var(--color-primary))', color: '#fff', border: 'none',
                              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
