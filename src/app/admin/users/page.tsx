'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, Users, Trash2, Shield, ShieldCheck, RefreshCw, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import styles from '../admin.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  email: string;
  role_type: number;
  permissions: string[];
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

// ─── Helper: get auth token ────────────────────────────────────────────────────
async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// ─── Component: Create Form ───────────────────────────────────────────────────
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
      const token = await getToken();
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
        setMsg({ type: 'error', text: json.error ?? 'Có lỗi xảy ra.' });
      } else {
        setMsg({ type: 'success', text: `✅ Tạo tài khoản "${email}" thành công!` });
        setEmail('');
        setPassword('');
        setRoleType(1);
        setSelectedPerms([]);
        onCreated();
      }
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
      {/* Header */}
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
        {/* Email + Password */}
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

        {/* Role Type */}
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
                  border: `2px solid ${roleType === opt.value ? 'hsl(var(--color-primary))' : 'rgba(255,255,255,0.08)'}`,
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

        {/* Permissions (only if Riêng Lẻ) */}
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

        {/* Feedback message */}
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

        {/* Submit */}
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
            color: '#fff', fontWeight: 700, fontSize: '1rem',
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

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Component: Admin Table ───────────────────────────────────────────────────
function AdminTable({ users, currentEmail, onDelete }: {
  users: AdminUser[];
  currentEmail: string;
  onDelete: (id: string, email: string) => void;
}) {
  if (users.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        background: 'hsl(var(--bg-card))',
        border: '1px solid rgba(255,255,255,0.06)',
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
            <th>Phân Quyền</th>
            <th>Quyền Truy Cập</th>
            <th>Ngày Tạo</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
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
                </div>
              </td>
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
              <td>
                {u.email !== currentEmail ? (
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    title="Xóa admin này"
                    onClick={() => onDelete(u.id, u.email)}
                  >
                    <Trash2 size={18} />
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>—</span>
                )}
              </td>
            </tr>
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

  const fetchUsers = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/list-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setListError(json.error ?? 'Không tải được danh sách.');
      } else {
        setUsers(json.users ?? []);
      }
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
    const token = await getToken();
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert('Lỗi: ' + (json.error ?? 'Không xóa được.'));
    } else {
      fetchUsers();
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          Quản Lý Tài Khoản Admin
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Tạo, xem và xóa tài khoản quản trị viên. Chỉ Full Admin mới có quyền thực hiện.
        </p>
      </div>

      {/* Create Form */}
      <CreateAdminForm onCreated={fetchUsers} />

      {/* Admin List */}
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
        <AdminTable users={users} currentEmail={currentEmail} onDelete={handleDelete} />
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
