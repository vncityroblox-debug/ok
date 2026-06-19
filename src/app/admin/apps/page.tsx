'use client';

import { useState, useEffect } from 'react';
import { AppWindow, Pencil, Trash2, Check, X, Lock, Unlock, Link2, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../admin.module.css';

interface Category {
  id: string;
  name: string;
}

interface AppItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  main_image_url: string;
  detail_images: string[];
  download_link: string;
  is_locked: boolean;
  category_id: string;
  categories: { name: string } | null;
}

interface KeyItem {
  id: string;
  key_value: string;
}

export default function AdminApps() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkKeyId, setBulkKeyId] = useState<string>('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mainImageUrl, setMainImageUrl] = useState('');
  const [detailImagesRaw, setDetailImagesRaw] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editMainImageUrl, setEditMainImageUrl] = useState('');
  const [editDetailImagesRaw, setEditDetailImagesRaw] = useState('');
  const [editDownloadLink, setEditDownloadLink] = useState('');
  const [editIsLocked, setEditIsLocked] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShorteningCreate, setIsShorteningCreate] = useState(false);
  const [isShorteningEdit, setIsShorteningEdit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [catsRes, appsRes, keysRes] = await Promise.all([
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('apps').select('*, categories(name)').eq('app_type', 'app').order('created_at', { ascending: false }),
        supabase.from('keys').select('id, key_value').order('created_at', { ascending: false }),
      ]);
      if (!catsRes.data || !appsRes.data) throw new Error('No data');
      setCategories(catsRes.data || []);
      setApps(appsRes.data || []);
      setKeys(keysRes.data || []);
    } catch (err: any) {
      console.error('Fetch data error:', err);
      setErrorMsg('Lỗi khi tải dữ liệu từ database.');
    } finally {
      setIsLoading(false);
    }
  }

  const makeSlug = (text: string) => {
    const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/([^a-z0-9\s-]|_)+/g, '').trim().replace(/\s+/g, '-');
    return `${clean}-${Math.floor(Date.now() / 1000)}`;
  };

  const handleShortenLink = async (currentLink: string, setLink: (val: string) => void, setShortening: (val: boolean) => void) => {
    if (!currentLink.trim()) { setErrorMsg('Vui lòng nhập Link Tải Về trước khi rút gọn.'); return; }
    setShortening(true); setErrorMsg('');
    try {
      const res = await fetch('/api/shorten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: currentLink.trim() }) });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Lỗi khi rút gọn link.'); } else { setLink(data.shortenedUrl); setSuccessMsg('Rút gọn link thành công!'); }
    } catch { setErrorMsg('Lỗi kết nối khi rút gọn link.'); } finally { setShortening(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setErrorMsg(''); setSuccessMsg('');
    const slug = makeSlug(name);
    const detailImages = detailImagesRaw.split(',').map((url) => url.trim()).filter((url) => url !== '');
    try {
      const { error } = await supabase.from('apps').insert({ name: name.trim(), slug, description: description.trim(), category_id: categoryId || null, main_image_url: mainImageUrl.trim(), detail_images: detailImages, download_link: downloadLink.trim(), is_locked: isLocked, app_type: 'app' });
      if (error) throw error;
      setSuccessMsg('Đăng ứng dụng thành công!');
      setName(''); setDescription(''); setCategoryId(''); setMainImageUrl(''); setDetailImagesRaw(''); setDownloadLink(''); setIsLocked(false);
      fetchData();
    } catch (err: any) { setErrorMsg(err.message || 'Lỗi khi đăng ứng dụng.'); } finally { setIsSubmitting(false); }
  };

  const handleStartEdit = (app: AppItem) => {
    setEditingId(app.id); setEditName(app.name); setEditDescription(app.description); setEditCategoryId(app.category_id || '');
    setEditMainImageUrl(app.main_image_url); setEditDetailImagesRaw(app.detail_images ? app.detail_images.join(', ') : '');
    setEditDownloadLink(app.download_link); setEditIsLocked(app.is_locked);
  };

  const handleCancelEdit = () => { setEditingId(null); };

  const handleUpdate = async (id: string) => {
    setErrorMsg(''); setSuccessMsg('');
    const detailImages = editDetailImagesRaw.split(',').map((url) => url.trim()).filter((url) => url !== '');
    try {
      const oldApp = apps.find((a) => a.id === id);
      let newSlug = oldApp?.slug || '';
      if (oldApp && oldApp.name !== editName.trim()) { newSlug = makeSlug(editName); }
      const { error } = await supabase.from('apps').update({ name: editName.trim(), slug: newSlug, description: editDescription.trim(), category_id: editCategoryId || null, main_image_url: editMainImageUrl.trim(), detail_images: detailImages, download_link: editDownloadLink.trim(), is_locked: editIsLocked }).eq('id', id);
      if (error) throw error;
      setSuccessMsg('Cập nhật ứng dụng thành công!'); setEditingId(null); fetchData();
    } catch (err: any) { setErrorMsg(err.message || 'Lỗi khi cập nhật ứng dụng.'); }
  };

  const handleDelete = async (id: string, appName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa ứng dụng "${appName}"?`)) {
      setErrorMsg(''); setSuccessMsg('');
      try {
        const { error } = await supabase.from('apps').delete().eq('id', id);
        if (error) throw error;
        setSuccessMsg(`Đã xóa ứng dụng "${appName}".`); fetchData();
      } catch (err: any) { setErrorMsg(err.message || 'Lỗi khi xóa ứng dụng.'); }
    }
  };

  // Bulk selection
  const allSelected = apps.length > 0 && apps.every((a) => selectedIds.has(a.id));
  const toggleSelectAll = () => {
    if (allSelected) { setSelectedIds(new Set()); } else { setSelectedIds(new Set(apps.map((a) => a.id))); }
  };
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;
    if (!bulkAction) { setErrorMsg('Vui lòng chọn hành động.'); return; }
    setErrorMsg(''); setSuccessMsg(''); setIsBulkProcessing(true);

    const ids = Array.from(selectedIds);

    try {
      if (bulkAction === 'lock') {
        const { error } = await supabase.from('apps').update({ is_locked: true }).in('id', ids);
        if (error) throw error;
        setSuccessMsg(`Đã khóa ${ids.length} ứng dụng.`);
      } else if (bulkAction === 'unlock') {
        const { error } = await supabase.from('apps').update({ is_locked: false }).in('id', ids);
        if (error) throw error;
        setSuccessMsg(`Đã mở khóa ${ids.length} ứng dụng.`);
      } else if (bulkAction === 'attach_key') {
        if (!bulkKeyId) { setErrorMsg('Vui lòng chọn Key để gắn.'); setIsBulkProcessing(false); return; }
        // Delete existing app_keys for these apps first, then insert
        await supabase.from('app_keys').delete().in('app_id', ids);
        const rows = ids.map((appId) => ({ key_id: bulkKeyId, app_id: appId }));
        const { error } = await supabase.from('app_keys').insert(rows);
        if (error) throw error;
        setSuccessMsg(`Đã gắn Key cho ${ids.length} ứng dụng.`);
      } else if (bulkAction === 'detach_key') {
        const { error } = await supabase.from('app_keys').delete().in('app_id', ids);
        if (error) throw error;
        setSuccessMsg(`Đã tháo Key khỏi ${ids.length} ứng dụng.`);
      }
      setSelectedIds(new Set()); setBulkAction(''); setBulkKeyId('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi thực hiện thao tác hàng loạt.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Quản Lý Ứng Dụng</h1>
        <p className={styles.pageSubtitle}>Đăng tải ứng dụng mới, thiết lập trạng thái Khóa/Mở, và cấu hình thông tin tải về.</p>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.95rem' }}>{errorMsg}</div>
      )}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.95rem' }}>{successMsg}</div>
      )}

      {editingId === null && (
        <form onSubmit={handleCreate} className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
          <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem' }}>Đăng Ứng Dụng Mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="appName">Tên Ứng Dụng</label>
              <input id="appName" type="text" required className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên ứng dụng" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="appCat">Danh Mục</label>
              <select id="appCat" required className={styles.formInput} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="appDesc">Mô Tả Ứng Dụng</label>
            <textarea id="appDesc" rows={4} required className={styles.formInput} style={{ resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chi tiết tính năng của ứng dụng..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="appMainImg">Hình Ảnh Chính (URL)</label>
              <input id="appMainImg" type="url" required className={styles.formInput} value={mainImageUrl} onChange={(e) => setMainImageUrl(e.target.value)} placeholder="Link ảnh cover chính" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="appDetailImgs">Ảnh Chi Tiết (Tùy chọn, nhiều link ngăn cách bằng dấu phẩy)</label>
              <input id="appDetailImgs" type="text" className={styles.formInput} value={detailImagesRaw} onChange={(e) => setDetailImagesRaw(e.target.value)} placeholder="link1.jpg, link2.jpg" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="appLink">Link Tải Về</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input id="appLink" type="url" required className={styles.formInput} style={{ flex: 1 }} value={downloadLink} onChange={(e) => setDownloadLink(e.target.value)} placeholder="Link direct download hoặc Drive, Mega..." />
              <button type="button" onClick={() => handleShortenLink(downloadLink, setDownloadLink, setIsShorteningCreate)} disabled={isShorteningCreate} style={{ whiteSpace: 'nowrap', padding: '10px 16px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '10px', color: 'hsl(var(--color-primary))', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                {isShorteningCreate ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Link2 size={14} />}
                {isShorteningCreate ? 'Đang rút...' : 'Rút Gọn'}
              </button>
            </div>
          </div>
          <div className={styles.formGroup} style={{ paddingBottom: '12px' }}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
              <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isLocked ? <Lock size={16} style={{ color: 'hsl(var(--color-primary))' }} /> : <Unlock size={16} />}
                Khóa tải về (Cần Key)
              </span>
            </label>
          </div>
          <button type="submit" className="neon-btn" style={{ marginTop: '10px' }} disabled={isSubmitting}>
            <AppWindow size={18} />
            {isSubmitting ? 'Đang đăng tải...' : 'Đăng Ứng Dụng'}
          </button>
        </form>
      )}

      {editingId !== null && (
        <form onSubmit={(e) => { e.preventDefault(); handleUpdate(editingId); }} className="glass-panel" style={{ padding: '30px', marginBottom: '40px', border: '1px solid hsl(var(--color-primary))' }}>
          <h3 style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.25rem', color: 'hsl(var(--color-primary))' }}>Chỉnh Sửa Ứng Dụng</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tên Ứng Dụng</label>
              <input type="text" required className={styles.formInput} value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Danh Mục</label>
              <select required className={styles.formInput} value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mô Tả Ứng Dụng</label>
            <textarea rows={4} required className={styles.formInput} style={{ resize: 'vertical' }} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Hình Ảnh Chính (URL)</label>
              <input type="url" required className={styles.formInput} value={editMainImageUrl} onChange={(e) => setEditMainImageUrl(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ảnh Chi Tiết (ngăn cách bằng dấu phẩy)</label>
              <input type="text" className={styles.formInput} value={editDetailImagesRaw} onChange={(e) => setEditDetailImagesRaw(e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Link Tải Về</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="url" required className={styles.formInput} style={{ flex: 1 }} value={editDownloadLink} onChange={(e) => setEditDownloadLink(e.target.value)} />
              <button type="button" onClick={() => handleShortenLink(editDownloadLink, setEditDownloadLink, setIsShorteningEdit)} disabled={isShorteningEdit} style={{ whiteSpace: 'nowrap', padding: '10px 16px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: '10px', color: 'hsl(var(--color-primary))', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}>
                {isShorteningEdit ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Link2 size={14} />}
                {isShorteningEdit ? 'Đang rút...' : 'Rút Gọn'}
              </button>
            </div>
          </div>
          <div className={styles.formGroup} style={{ paddingBottom: '12px' }}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={editIsLocked} onChange={(e) => setEditIsLocked(e.target.checked)} />
              <span style={{ color: 'hsl(var(--text-primary))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {editIsLocked ? <Lock size={16} style={{ color: 'hsl(var(--color-primary))' }} /> : <Unlock size={16} />}
                Khóa tải về (Cần Key)
              </span>
            </label>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="submit" className="neon-btn"><Check size={18} /> Cập nhật</button>
            <button type="button" onClick={handleCancelEdit} className="neon-btn-secondary">Hủy</button>
          </div>
        </form>
      )}

      <div className="glass-panel" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>Kho Ứng Dụng</h3>
          {selectedIds.size > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>Đã chọn {selectedIds.size} / {apps.length}</span>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '16px', borderRadius: '12px', background: 'rgba(13, 110, 253, 0.06)', border: '1px solid rgba(13, 110, 253, 0.15)', marginBottom: '20px' }}>
            <select value={bulkAction} onChange={(e) => { setBulkAction(e.target.value); setBulkKeyId(''); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-glass))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-primary))', fontSize: '0.9rem' }}>
              <option value="">-- Chọn hành động --</option>
              <option value="lock">🔐 Khóa hàng loạt</option>
              <option value="unlock">🔓 Mở khóa hàng loạt</option>
              <option value="attach_key">🔑 Gắn Key hàng loạt</option>
              <option value="detach_key">🗑️ Tháo Key hàng loạt</option>
            </select>
            {bulkAction === 'attach_key' && (
              <select value={bulkKeyId} onChange={(e) => setBulkKeyId(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-glass))', background: 'hsl(var(--bg-card))', color: 'hsl(var(--text-primary))', fontSize: '0.9rem', minWidth: '200px' }}>
                <option value="">-- Chọn Key --</option>
                {keys.map((k) => (<option key={k.id} value={k.id}>{k.key_value}</option>))}
              </select>
            )}
            <button onClick={handleBulkAction} disabled={isBulkProcessing} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'hsl(var(--color-primary))', color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isBulkProcessing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
              {isBulkProcessing ? 'Đang xử lý...' : 'Thực hiện'}
            </button>
            <button onClick={() => { setSelectedIds(new Set()); setBulkAction(''); setBulkKeyId(''); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid hsl(var(--border-glass))', background: 'transparent', color: 'hsl(var(--text-secondary))', cursor: 'pointer', fontSize: '0.9rem' }}>
              Bỏ chọn
            </button>
          </div>
        )}

        {isLoading ? (
          <p style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '40px 0' }}>Đang tải dữ liệu ứng dụng...</p>
        ) : apps.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>Chưa có ứng dụng nào được đăng.</p>
        ) : (
          <div className={styles.tableContainer} style={{ marginTop: 0 }}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th>Hình</th>
                  <th>Tên App</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Slug Link</th>
                  <th style={{ width: '100px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} style={selectedIds.has(app.id) ? { background: 'rgba(13, 110, 253, 0.05)' } : undefined}>
                    <td>
                      <input type="checkbox" checked={selectedIds.has(app.id)} onChange={() => toggleSelect(app.id)} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>
                      <img src={app.main_image_url} alt={app.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid hsl(var(--border-glass))' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{app.name}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.6, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.description}</div>
                    </td>
                    <td>{app.categories?.name || 'Chưa phân loại'}</td>
                    <td>
                      {app.is_locked ? (
                        <span className={`${styles.badge} ${styles.badgeDanger}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> Khóa</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeSuccess}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Unlock size={12} /> Mở</span>
                      )}
                    </td>
                    <td><code style={{ fontSize: '0.8rem' }}>/app/{app.slug}</code></td>
                    <td>
                      <div className={styles.actionCell}>
                        <button onClick={() => handleStartEdit(app)} className={`${styles.actionBtn} ${styles.editBtn}`} title="Sửa" disabled={editingId !== null}><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(app.id, app.name)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Xóa" disabled={editingId !== null}><Trash2 size={18} /></button>
                      </div>
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
