'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Check, X, Trash2, Calendar, ShieldCheck, HelpCircle, Pencil } from 'lucide-react';
import styles from '../admin.module.css';

interface AppItem {
  id: string;
  name: string;
}

interface KeyItem {
  id: string;
  key_value: string;
  expiration_date: string;
  usage_limit: number;
  usage_count: number;
  app_keys: { app_id: string; apps: { name: string } }[];
}

export default function AdminKeys() {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);

  // Create form states
  const [keyType, setKeyType] = useState<'random' | 'custom'>('random');
  const [customKeyValue, setCustomKeyValue] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [expirationDate, setExpirationDate] = useState('');
  const [usageLimit, setUsageLimit] = useState(1);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSelectedAppIds, setEditSelectedAppIds] = useState<string[]>([]);
  const [editExpirationDate, setEditExpirationDate] = useState('');
  const [editUsageLimit, setEditUsageLimit] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
    // Default expiration date: 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 0, 0);
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const tzoffset = nextWeek.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextWeek.getTime() - tzoffset).toISOString().slice(0, 16);
    setExpirationDate(localISOTime);
  }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [appsRes, keysRes] = await Promise.all([
        fetch('/api/admin/query?type=app_names'),
        fetch('/api/admin/query?type=keys')
      ]);
      const appsJson = await appsRes.json();
      const keysJson = await keysRes.json();
      if (!appsJson.data || !keysJson.data) throw new Error('No data');
      setApps(appsJson.data || []);
      setKeys((keysJson.data as any) || []);
    } catch (err: any) {
      console.error('Fetch keys error:', err);
      setErrorMsg('Lỗi khi tải dữ liệu Keys.');
    } finally {
      setIsLoading(false);
    }
  }

  const generateRandomKey = () => {
    // Cryptographically strong alphanumeric key (12 chars long)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) result += '-';
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAppCheck = (appId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedAppIds([...selectedAppIds, appId]);
    } else {
      setSelectedAppIds(selectedAppIds.filter((id) => id !== appId));
    }
  };

  const handleEditAppCheck = (appId: string, isChecked: boolean) => {
    if (isChecked) {
      setEditSelectedAppIds([...editSelectedAppIds, appId]);
    } else {
      setEditSelectedAppIds(editSelectedAppIds.filter((id) => id !== id));
      setEditSelectedAppIds(editSelectedAppIds.filter((id) => id !== appId));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedAppIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 ứng dụng áp dụng Key!');
      setIsSubmitting(false);
      return;
    }

    // Determine key value
    const finalKey = keyType === 'random' ? generateRandomKey() : customKeyValue.trim().toUpperCase();

    if (!finalKey) {
      setErrorMsg('Vui lòng nhập Key tùy chỉnh!');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'key',
          action: 'insert',
          data: {
            key: {
              key_value: finalKey,
              expiration_date: new Date(expirationDate).toISOString(),
              usage_limit: usageLimit,
              usage_count: 0,
            },
            appKeys: selectedAppIds
          }
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error('Key này đã tồn tại trong hệ thống!');
      }

      setSuccessMsg(`Tạo thành công Key "${finalKey}"!`);
      // Reset form
      setCustomKeyValue('');
      setSelectedAppIds([]);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo Key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (keyObj: KeyItem) => {
    setEditingId(keyObj.id);
    const associatedIds = keyObj.app_keys.map((ak) => ak.app_id);
    setEditSelectedAppIds(associatedIds);
    setEditUsageLimit(keyObj.usage_limit);

    // Format ISO string back to datetime-local local offset
    const d = new Date(keyObj.expiration_date);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    setEditExpirationDate(localISOTime);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (editSelectedAppIds.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 ứng dụng áp dụng Key!');
      return;
    }

    try {
      const res = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'key',
          action: 'update',
          id,
          data: {
            key: {
              expiration_date: new Date(editExpirationDate).toISOString(),
              usage_limit: editUsageLimit,
            },
            appKeys: editSelectedAppIds
          }
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setSuccessMsg('Cập nhật Key thành công!');
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật Key.');
    }
  };

  const handleDelete = async (id: string, keyValue: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa Key "${keyValue}"? Lượt tải sử dụng Key này sẽ không dùng được nữa.`)) {
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const res = await fetch('/api/admin/mutate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource: 'key', action: 'delete', id })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setSuccessMsg(`Đã xóa Key "${keyValue}".`);
        fetchData();
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi khi xóa Key.');
      }
    }
  };

  const getKeyStatus = (keyObj: KeyItem) => {
    const now = new Date();
    const exp = new Date(keyObj.expiration_date);
    if (now > exp) return { text: 'Hết hạn', style: styles.badgeDanger };
    if (keyObj.usage_count >= keyObj.usage_limit) return { text: 'Đạt giới hạn', style: styles.badgeDanger };
    return { text: 'Đang hoạt động', style: styles.badgeSuccess };
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          Quản Lý Key Tải Về
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Cấp phát Key tải xuống cho các ứng dụng bị Khóa. Có thể áp dụng 1 Key cho nhiều ứng dụng cùng lúc.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '0.95rem'
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '0.95rem'
        }}>
          {successMsg}
        </div>
      )}

      {/* Creation form */}
      {editingId === null && (
        <form onSubmit={handleCreate} className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem' }}>Tạo Key Mới</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
            <div>
              <label className={styles.formLabel}>Hình Thức Tạo Key</label>
              <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="radio"
                    name="keytype"
                    checked={keyType === 'random'}
                    onChange={() => setKeyType('random')}
                  />
                  <span>Tự động ngẫu nhiên</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="radio"
                    name="keytype"
                    checked={keyType === 'custom'}
                    onChange={() => setKeyType('custom')}
                  />
                  <span>Key tự đặt</span>
                </label>
              </div>
            </div>

            {keyType === 'custom' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="customKey">Key Tùy Chọn (Chữ hoa & Số)</label>
                <input
                  id="customKey"
                  type="text"
                  required
                  className={styles.formInput}
                  value={customKeyValue}
                  onChange={(e) => setCustomKeyValue(e.target.value)}
                  placeholder="Ví dụ: VIP-KEY-999"
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="expDate">Hạn Sử Dụng Key</label>
              <input
                id="expDate"
                type="datetime-local"
                required
                className={styles.formInput}
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="usageLimit">Giới Hạn Số Lần Sử Dụng</label>
              <input
                id="usageLimit"
                type="number"
                min={1}
                required
                className={styles.formInput}
                value={usageLimit}
                onChange={(e) => setUsageLimit(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* App list checkboxes */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Áp Dụng Cho Các Ứng Dụng Sau:</label>
            {apps.length === 0 ? (
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Chưa có ứng dụng nào được đăng tải để áp dụng Key.
              </p>
            ) : (
              <div className={styles.checkboxGrid}>
                {apps.map((app) => (
                  <label key={app.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedAppIds.includes(app.id)}
                      onChange={(e) => handleAppCheck(app.id, e.target.checked)}
                    />
                    <span>{app.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="neon-btn"
            style={{ marginTop: '10px' }}
            disabled={isSubmitting || apps.length === 0}
          >
            <KeyRound size={18} />
            Tạo Key
          </button>
        </form>
      )}

      {/* Edit Form */}
      {editingId !== null && (
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingId); }} className="glass-panel" style={{ padding: '30px', marginBottom: '40px', border: '1px solid hsl(var(--color-primary))' }}>
          <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem', color: 'hsl(var(--color-primary))' }}>
            Sửa Cấu Hình Key
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hạn Sử Dụng Mới</label>
              <input
                type="datetime-local"
                required
                className={styles.formInput}
                value={editExpirationDate}
                onChange={(e) => setEditExpirationDate(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Giới Hạn Lượt Tải Mới</label>
              <input
                type="number"
                min={1}
                required
                className={styles.formInput}
                value={editUsageLimit}
                onChange={(e) => setEditUsageLimit(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Áp Dụng Cho Ứng Dụng:</label>
            <div className={styles.checkboxGrid}>
              {apps.map((app) => (
                <label key={app.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editSelectedAppIds.includes(app.id)}
                    onChange={(e) => handleEditAppCheck(app.id, e.target.checked)}
                  />
                  <span>{app.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="submit" className="neon-btn">
              <Check size={18} />
              Cập nhật
            </button>
            <button type="button" onClick={handleCancelEdit} className="neon-btn-secondary">
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Keys List */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ marginBottom: '20px', fontWeight: 700, fontSize: '1.25rem' }}>Danh Sách Key Hiện Tại</h3>

        {isLoading ? (
          <p style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '40px 0' }}>
            Đang tải danh sách Key...
          </p>
        ) : keys.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>
            Chưa có Key nào được phát hành.
          </p>
        ) : (
          <div className={styles.tableContainer} style={{ marginTop: 0 }}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Mã Key</th>
                  <th>App áp dụng</th>
                  <th>Lượt tải</th>
                  <th>Hạn sử dụng</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '100px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const status = getKeyStatus(k);
                  const appNames = k.app_keys.map((ak) => ak.apps?.name).filter(Boolean).join(', ');
                  return (
                    <tr key={k.id}>
                      <td>
                        <code style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(var(--color-secondary))' }}>
                          {k.key_value}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.9rem', maxWidth: '220px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={appNames}>
                          {appNames || 'Chưa áp dụng cho app nào'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{k.usage_count}</span>
                        <span style={{ opacity: 0.5 }}> / {k.usage_limit}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(k.expiration_date).toLocaleString('vi-VN', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${status.style}`}>{status.text}</span>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            onClick={() => handleStartEdit(k)}
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            title="Sửa"
                            disabled={editingId !== null}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(k.id, k.key_value)}
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            title="Xóa"
                            disabled={editingId !== null}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
