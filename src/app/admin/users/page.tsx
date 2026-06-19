'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  UserPlus, Users, Trash2, Shield, ShieldCheck, RefreshCw, Eye, EyeOff,
  CheckCircle2, XCircle, Edit3, Gift, Activity, X, Plus, Copy, ExternalLink,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import styles from '../admin.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  role_type: number;
  permissions: string[];
  created_at: string;
  username?: string;
  full_name?: string;
  phone?: string;
  total_purchases?: number;
}

interface ActivityLog {
  id: string;
  created_at: string;
  action: string;
  details: string;
  ip_address: string;
}

interface PurchaseItem {
  id: string;
  item_type: string;
  item_name: string;
  key_code: string;
  notes: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_PERMISSIONS = [
  { key: 'statistics', label: 'Thống Kê' },
  { key: 'settings', label: 'Cấu Hình Web' },
  { key: 'categories', label: 'Danh Mục' },
  { key: 'apps', label: 'Đăng Ứng Dụng' },
  { key: 'source-codes', label: 'Đăng Mã Nguồn' },
  { key: 'keys', label: 'Quản Lý Key' },
  { key: 'posts', label: 'Viết Bài (Blog)' },
];

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

// ─── Component: Create Form (unchanged) ──────────────────────────────────────
function CreateAdminForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [roleType, setRoleType] = useState<1 | 2>(1);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' });
      return;
    }
    if (roleType === 2 && selectedPerms.length === 0) {
      setMsg({ type: 'error', text: 'Quyền Riêng Lẻ cần chọn ít nhất 1 quyền.' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email,
          password,
          role_type: roleType,
          permissions: roleType === 2 ? selectedPerms : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: json.error || 'Lỗi không xác định' });
        setLoading(false);
        return;
      }
      setMsg({ type: 'success', text: `✅ Tạo tài khoản "${email}" thành công!` });
      setEmail('');
      setPassword('');
      setRoleType(1);
      setSelectedPerms([]);
      onCreated();
    } catch {
      setMsg({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'hsl(var(--bg-card))',
      border: '1px solid rgba(139,92,246,0.2)',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '36px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <UserPlus size={20} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2px' }}>Tạo Tài Khoản Admin</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>Thêm quản trị viên mới vào hệ thống</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.formLabel}>Email</label>
            <input
              id="admin-email"
              type="email"
              className={styles.formInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.formLabel}>Mật Khẩu</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPass ? 'text' : 'password'}
                className={styles.formInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                required
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'hsl(var(--text-muted))',
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Phân Quyền</label>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[
              { value: 1, label: '⚡ Full Quyền', desc: 'Toàn quyền quản trị' },
              { value: 2, label: '🔒 Riêng Lẻ', desc: 'Chọn quyền bên dưới' },
            ].map((opt) => (
              <label
                key={opt.value}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: `2px solid ${roleType === opt.value ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                  background: roleType === opt.value ? 'rgba(139,92,246,0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="roleType"
                  value={opt.value}
                  checked={roleType === opt.value}
                  onChange={() => setRoleType(opt.value as 1 | 2)}
                  style={{ display: 'none' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {roleType === 2 && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Chọn Quyền Truy Cập</label>
            <div className={styles.checkboxGrid}>
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm.key} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.key)}
                    onChange={() => togglePerm(perm.key)}
                  />
                  <span>{perm.label}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedPerms(ALL_PERMISSIONS.map((p) => p.key))}
                style={{
                  fontSize: '0.78rem', padding: '4px 12px', borderRadius: '8px',
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                  color: 'hsl(var(--color-primary))', cursor: 'pointer',
                }}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedPerms([])}
                style={{
                  fontSize: '0.78rem', padding: '4px 12px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', cursor: 'pointer',
                }}
              >
                Bỏ tất cả
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
            background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: msg.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '0.9rem',
          }}>
            {msg.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{msg.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            width: '100%', padding: '14px',
            background: loading
              ? 'rgba(139,92,246,0.3)'
              : 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
            border: 'none', borderRadius: '12px',
            color: 'hsl(var(--text-primary))', fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Đang tạo...
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Tạo Tài Khoản Admin
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Modal: Edit User ────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [username, setUsername] = useState(user.username ?? '');
  const [fullName, setFullName] = useState(user.full_name ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [roleType, setRoleType] = useState<1 | 2>(user.role_type as 1 | 2);
  const [selectedPerms, setSelectedPerms] = useState<string[]>(user.permissions ?? []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (roleType === 2 && selectedPerms.length === 0) {
      setMsg({ type: 'error', text: 'Cần chọn ít nhất 1 quyền.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: user.id,
          username,
          full_name: fullName,
          phone,
          role_type: roleType,
          permissions: roleType === 2 ? selectedPerms : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: json.error || 'Lỗi cập nhật' });
      } else {
        setMsg({ type: 'success', text: 'Cập nhật thành công!' });
        setTimeout(() => { onSaved(); onClose(); }, 800);
      }
    } catch {
      setMsg({ type: 'error', text: 'Không kết nối được server.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={20} style={{ color: 'hsl(var(--color-primary))' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sửa Người Dùng</h3>
          </div>
          <button style={closeBtnStyle} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={{ ...inputStyle, background: 'hsl(var(--bg-subtle))', opacity: 0.7, cursor: 'not-allowed' }}
              value={user.email}
              readOnly
            />
          </div>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <div>
            <label style={labelStyle}>Họ và Tên</label>
            <input
              style={inputStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label style={labelStyle}>Số Điện Thoại</label>
            <input
              style={inputStyle}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
            />
          </div>

          <div>
            <label style={labelStyle}>Loại Quyền</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { value: 1, label: 'Full Quyền' },
                { value: 2, label: 'Riêng Lẻ' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `2px solid ${roleType === opt.value ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                    background: roleType === opt.value ? 'rgba(139,92,246,0.1)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="radio"
                    name="editRoleType"
                    value={opt.value}
                    checked={roleType === opt.value}
                    onChange={() => setRoleType(opt.value as 1 | 2)}
                    style={{ display: 'none' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {roleType === 2 && (
            <div>
              <label style={labelStyle}>Quyền Truy Cập</label>
              <div className={styles.checkboxGrid}>
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm.key} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm.key)}
                      onChange={() => togglePerm(perm.key)}
                    />
                    <span>{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {msg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '8px',
              background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: msg.type === 'success' ? '#10b981' : '#ef4444',
              fontSize: '0.85rem',
            }}>
              {msg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {msg.text}
            </div>
          )}

          <button
            style={{ ...btnPrimary, opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Lưu Thay Đổi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Gift Key ─────────────────────────────────────────────────────────
function GiftKeyModal({ user, onClose, onSaved }: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [itemType, setItemType] = useState<'app' | 'source_code'>('app');
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [keyCode, setKeyCode] = useState('');
  const [notes, setNotes] = useState('');
  const [existingPurchases, setExistingPurchases] = useState<PurchaseItem[]>([]);
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

  const fetchPurchases = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setExistingPurchases(data ?? []);
    } catch {
      setExistingPurchases([]);
    }
  }, [user.id]);

  useEffect(() => {
    fetchItems(itemType);
    fetchPurchases();
  }, [itemType, fetchItems, fetchPurchases]);

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
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: json.error || 'Lỗi tặng key' });
      } else {
        setMsg({ type: 'success', text: 'Tặng key thành công!' });
        setKeyCode('');
        setNotes('');
        setSelectedItemId('');
        fetchPurchases();
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
                <Copy size={14} />
                Tạo Key
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Ghi Chú</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm..."
            />
          </div>

          {msg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '8px',
              background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: msg.type === 'success' ? '#10b981' : '#ef4444',
              fontSize: '0.85rem',
            }}>
              {msg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
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

          {existingPurchases.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px', color: 'hsl(var(--text-secondary))' }}>
                Lịch Sử Mua Hàng ({existingPurchases.length})
              </h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {existingPurchases.map((p) => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Activity Logs ────────────────────────────────────────────────────
function ActivityLogsModal({ user, onClose }: {
  user: AdminUser;
  onClose: () => void;
}) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/user-activity?user_id=${user.id}`);
        const json = await res.json();
        setLogs(json.logs ?? json.data ?? json ?? []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalCardStyle, maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nhật Ký Hoạt Động - {user.email}</h3>
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
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
            Không có hoạt động nào.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {['Thời Gian', 'Hành Động', 'Chi Tiết', 'IP'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        color: 'hsl(var(--text-muted))',
                        borderBottom: '1px solid hsl(var(--border-glass))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border-glass))', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border-glass))' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 500,
                        background: 'rgba(139,92,246,0.1)',
                        color: 'hsl(var(--color-primary))',
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border-glass))', maxWidth: '250px' }}>
                      <span style={{ wordBreak: 'break-word' }}>{log.details}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid hsl(var(--border-glass))', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {log.ip_address ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Component: Admin Table ───────────────────────────────────────────────────
function AdminTable({ users, currentEmail, onDelete, onEdit, onGift, onLog }: {
  users: AdminUser[];
  currentEmail: string;
  onDelete: (id: string, email: string) => void;
  onEdit: (user: AdminUser) => void;
  onGift: (user: AdminUser) => void;
  onLog: (user: AdminUser) => void;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (users.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        background: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border-glass))',
        borderRadius: '16px', color: 'hsl(var(--text-muted))',
      }}>
        <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
        <p>Chưa có admin nào.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.adminTable}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Họ Tên</th>
            <th>Phone</th>
            <th>Phân Quyền</th>
            <th>Quyền Truy Cập</th>
            <th>Ngày Tạo</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <>
              <tr
                key={u.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: u.role_type === 1
                        ? 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))'
                        : 'rgba(245,158,11,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {u.role_type === 1
                        ? <ShieldCheck size={16} color="#fff" />
                        : <Shield size={16} color="#f59e0b" />}
                    </div>
                    <span style={{ fontWeight: 500 }}>{u.email}</span>
                    {u.email === currentEmail && (
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Bạn</span>
                    )}
                    {expandedRow === u.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{u.full_name ?? '—'}</td>
                <td style={{ fontSize: '0.85rem' }}>{u.phone ?? '—'}</td>
                <td>
                  {u.role_type === 1 ? (
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>Full Quyền</span>
                  ) : (
                    <span className={`${styles.badge} ${styles.badgeWarning}`}>Riêng Lẻ</span>
                  )}
                </td>
                <td>
                  {u.role_type === 1 ? (
                    <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>Tất cả quyền</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(u.permissions ?? []).length === 0 ? (
                        <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>Không có quyền</span>
                      ) : (
                        (u.permissions ?? []).map((p) => (
                          <span key={p} style={{
                            fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px',
                            background: 'rgba(139,92,246,0.15)',
                            color: 'hsl(var(--color-primary))',
                          }}>
                            {ALL_PERMISSIONS.find((x) => x.key === p)?.label ?? p}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                  {new Date(u.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className={styles.actionCell}>
                    <button
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      title="Sửa người dùng"
                      onClick={() => onEdit(u)}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      title="Tặng Key"
                      onClick={() => onGift(u)}
                      style={{ color: '#f59e0b' }}
                    >
                      <Gift size={16} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      title="Nhật ký"
                      onClick={() => onLog(u)}
                      style={{ color: '#10b981' }}
                    >
                      <Activity size={16} />
                    </button>
                    {u.email !== currentEmail && (
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        title="Xóa admin này"
                        onClick={() => onDelete(u.id, u.email)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {expandedRow === u.id && (
                <tr key={`${u.id}-detail`}>
                  <td colSpan={7} style={{
                    background: 'hsl(var(--bg-subtle))',
                    borderRadius: '0 0 12px 12px',
                    borderLeft: '1px solid hsl(var(--border-glass))',
                    borderRight: '1px solid hsl(var(--border-glass))',
                    borderBottom: '1px solid hsl(var(--border-glass))',
                    padding: '16px 20px',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Username</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.username ?? '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Họ và Tên</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.full_name ?? '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Số Điện Thoại</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.phone ?? '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Ngày Tạo</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {new Date(u.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Tổng Mua Hàng</div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{u.total_purchases ?? 0}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  // Modal states
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [giftingUser, setGiftingUser] = useState<AdminUser | null>(null);
  const [logUser, setLogUser] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const [adminRes, profilesRes] = await Promise.all([
        supabase
          .from('admin_users')
          .select('id, email, role_type, permissions, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('id, username, full_name, phone'),
      ]);

      if (adminRes.error) {
        setListError(adminRes.error.message);
        return;
      }

      const profileMap = new Map<string, { username: string; full_name: string; phone: string }>();
      (profilesRes.data ?? []).forEach((p: any) => {
        profileMap.set(p.id, { username: p.username, full_name: p.full_name, phone: p.phone });
      });

      const merged = (adminRes.data ?? []).map((u: any) => {
        const profile = profileMap.get(u.id);
        return {
          ...u,
          username: profile?.username ?? '',
          full_name: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
        };
      });

      setUsers(merged);
    } catch {
      setListError('Không kết nối được server.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentEmail(data.session?.user?.email ?? '');
    })();
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Bạn có chắc muốn xóa admin "${email}"?\nHành động này không thể hoàn tác!`)) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert('Lỗi: ' + (json.error || 'Không thể xóa'));
      return;
    }
    fetchUsers();
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          Quản Lý Tài Khoản Admin
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Tạo, xem và xóa tài khoản quản trị viên. Chỉ Full Admin mới có quyền thực hiện.
        </p>
      </div>

      <CreateAdminForm onCreated={fetchUsers} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} style={{ color: 'hsl(var(--color-primary))' }} />
          Danh Sách Admin ({users.length})
        </h2>
        <button
          onClick={fetchUsers}
          disabled={loadingList}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: 'hsl(var(--color-primary))',
            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
          }}
        >
          <RefreshCw size={14} style={{ animation: loadingList ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới
        </button>
      </div>

      {listError && (
        <div style={{
          padding: '16px', borderRadius: '12px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444',
        }}>
          ⚠️ {listError}
        </div>
      )}

      {loadingList ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'hsl(var(--text-muted))' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Đang tải danh sách admin...</p>
        </div>
      ) : (
        <AdminTable
          users={users}
          currentEmail={currentEmail}
          onDelete={handleDelete}
          onEdit={setEditingUser}
          onGift={setGiftingUser}
          onLog={setLogUser}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={fetchUsers}
        />
      )}

      {giftingUser && (
        <GiftKeyModal
          user={giftingUser}
          onClose={() => setGiftingUser(null)}
          onSaved={fetchUsers}
        />
      )}

      {logUser && (
        <ActivityLogsModal
          user={logUser}
          onClose={() => setLogUser(null)}
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
