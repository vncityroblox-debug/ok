'use client';

import { useState, useEffect } from 'react';
import { FolderPlus, Pencil, Trash2, Check, X } from 'lucide-react';
import styles from '../admin.module.css';

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/query?type=categories');
      const json = await res.json();
      if (!json.data) throw new Error('No data');
      setCategories(json.data || []);
    } catch (err: any) {
      console.error('Fetch categories error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const makeSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese accents
      .replace(/[đĐ]/g, 'd')
      .replace(/([^a-z0-9\s-]|_)+/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const slug = makeSlug(name);
    try {
      const res = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'category',
          action: 'insert',
          data: { name: name.trim(), slug, image_url: imageUrl.trim() }
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error('Tên danh mục hoặc slug đã tồn tại!');
      }

      setName('');
      setImageUrl('');
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo danh mục.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditImageUrl(cat.image_url);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditImageUrl('');
  };

  const handleUpdate = async (id: string) => {
    setErrorMsg('');
    const slug = makeSlug(editName);
    try {
      const res = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'category',
          action: 'update',
          id,
          data: { name: editName.trim(), slug, image_url: editImageUrl.trim() }
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error('Tên danh mục hoặc slug đã tồn tại!');
      }

      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật danh mục.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"? Các ứng dụng thuộc danh mục này sẽ mất liên kết danh mục.`)) {
      setErrorMsg('');
      try {
        const res = await fetch('/api/admin/mutate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource: 'category', action: 'delete', id })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        fetchCategories();
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi khi xóa danh mục.');
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          Quản Lý Danh Mục
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>
          Tạo và điều chỉnh các danh mục ứng dụng. Hỗ trợ tất cả định dạng ảnh (gif, png, jpg, svg)
        </p>
      </div>

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '12px',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        {/* Create Form */}
        <form onSubmit={handleCreate} className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>Tạo Danh Mục Mới</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="catName">Tên Danh Mục</label>
            <input
              id="catName"
              type="text"
              required
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Trò Chơi, Tiện Ích"
            />
          </div>

          <div className={styles.formGroup} style={{ marginBottom: '28px' }}>
            <label className={styles.formLabel} htmlFor="catImage">Hình Đại Diện (URL)</label>
            <input
              id="catImage"
              type="url"
              required
              className={styles.formInput}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Link ảnh gif, png, jpg..."
            />
          </div>

          <button
            type="submit"
            className="neon-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={isSubmitting}
          >
            <FolderPlus size={18} />
            {isSubmitting ? 'Đang tạo...' : 'Tạo Danh Mục'}
          </button>
        </form>

        {/* Categories Table List */}
        <div className="glass-panel" style={{ padding: '24px', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>Danh Sách Danh Mục</h3>
          
          {isLoading ? (
            <p style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '40px 0' }}>
              Đang tải danh sách danh mục...
            </p>
          ) : categories.length === 0 ? (
            <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>
              Chưa có danh mục nào được tạo.
            </p>
          ) : (
            <div className={styles.tableContainer} style={{ marginTop: 0 }}>
              <table className={styles.adminTable}>
                <thead>
                  <tr>
                    <th>Hình</th>
                    <th>Tên danh mục</th>
                    <th>Đường dẫn (Slug)</th>
                    <th style={{ width: '100px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const isEditing = editingId === cat.id;
                    return (
                      <tr key={cat.id}>
                        <td>
                          {isEditing ? (
                            <input
                              type="url"
                              className={styles.formInput}
                              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              value={editImageUrl}
                              onChange={(e) => setEditImageUrl(e.target.value)}
                            />
                          ) : (
                            <img
                              src={cat.image_url || '/placeholder-icon.png'}
                              alt={cat.name}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid rgba(255,255,255,0.1)',
                              }}
                            />
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              className={styles.formInput}
                              style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          ) : (
                            <span style={{ fontWeight: 600, color: '#fff' }}>{cat.name}</span>
                          )}
                        </td>
                        <td>
                          <code>/{cat.slug}</code>
                        </td>
                        <td>
                          <div className={styles.actionCell}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleUpdate(cat.id)}
                                  className={`${styles.actionBtn} ${styles.editBtn}`}
                                  title="Lưu"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  title="Hủy"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(cat)}
                                  className={`${styles.actionBtn} ${styles.editBtn}`}
                                  title="Sửa"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => handleDelete(cat.id, cat.name)}
                                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                  title="Xóa"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
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
    </div>
  );
}
