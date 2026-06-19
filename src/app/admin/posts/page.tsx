'use client';

import { useState, useEffect } from 'react';
import { FileText, Pencil, Trash2, Check, X, Eye, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../admin.module.css';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (error || !data) throw new Error(error?.message || 'No data');
      setPosts(data || []);
    } catch (err: any) {
      console.error('Fetch posts error:', err);
      setErrorMsg('Lỗi khi tải danh sách bài viết.');
    } finally {
      setIsLoading(false);
    }
  }

  const makeSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^a-z0-9\s-]|_)+/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const slug = makeSlug(title);

    try {
      const { error } = await supabase.from('posts').insert({
        title: title.trim(), slug, content: content.trim()
      });
      if (error) {
        if (error.message?.includes('duplicate')) {
          throw new Error('Tiêu đề bài viết này đã trùng lặp!');
        }
        throw new Error(error.message);
      }

      setSuccessMsg('Đăng bài viết thành công!');
      setTitle('');
      setContent('');
      fetchPosts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đăng bài viết.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (post: Post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setPreviewMode('edit'); // switch editor pane
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');

    const slug = makeSlug(editTitle);

    try {
      const { error } = await supabase.from('posts').update({
        title: editTitle.trim(), slug, content: editContent.trim()
      }).eq('id', id);
      if (error) throw new Error(error.message);

      setSuccessMsg('Cập nhật bài viết thành công!');
      setEditingId(null);
      fetchPosts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật bài viết.');
    }
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài viết "${postTitle}"?`)) {
      setErrorMsg('');
      setSuccessMsg('');
      try {
        const { error } = await supabase.from('posts').delete().eq('id', id);
        if (error) throw new Error(error.message);
        setSuccessMsg(`Đã xóa bài viết "${postTitle}".`);
        fetchPosts();
      } catch (err: any) {
        setErrorMsg(err.message || 'Lỗi khi xóa bài viết.');
      }
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Quản Lý Bài Viết (Blog)
        </h1>
        <p className={styles.pageSubtitle}>
          Đăng bài viết mới, nhúng mã HTML tùy chọn để tùy chỉnh thiết kế bài viết hoặc viết dạng text đơn giản.
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

      {/* Editor & Preview Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start', marginBottom: '40px' }}>
        {/* Editor Form */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.25rem' }}>
              {editingId !== null ? 'Chỉnh Sửa Bài Viết' : 'Viết Bài Mới'}
            </h3>
            
            <div style={{ display: 'flex', background: 'hsl(var(--bg-subtle))', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                style={{
                  background: previewMode === 'edit' ? 'hsl(var(--color-primary))' : 'transparent',
                  color: previewMode === 'edit' ? '#fff' : 'hsl(var(--text-secondary))',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
                onClick={() => setPreviewMode('edit')}
              >
                <Edit3 size={14} /> Trình soạn thảo
              </button>
              <button
                type="button"
                style={{
                  background: previewMode === 'preview' ? 'hsl(var(--color-primary))' : 'transparent',
                  color: previewMode === 'preview' ? '#fff' : 'hsl(var(--text-secondary))',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600
                }}
                onClick={() => setPreviewMode('preview')}
              >
                <Eye size={14} /> Xem thử HTML
              </button>
            </div>
          </div>

          {editingId === null ? (
            <form onSubmit={handleCreate}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="postTitle">Tiêu Đề Bài Viết</label>
                <input
                  id="postTitle"
                  type="text"
                  required
                  className={styles.formInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề hấp dẫn..."
                  disabled={isSubmitting}
                />
              </div>

              {previewMode === 'edit' ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="postContent">Nội Dung Bài Viết (Hỗ trợ HTML)</label>
                  <textarea
                    id="postContent"
                    rows={12}
                    required
                    className={styles.formInput}
                    style={{ resize: 'vertical', fontFamily: 'monospace' }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="<p>Nhập nội dung ở đây hoặc nhúng mã HTML...</p>"
                    disabled={isSubmitting}
                  />
                </div>
              ) : (
                <div style={{
                  minHeight: '290px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid hsl(var(--border-glass))',
                  padding: '20px',
                  borderRadius: '12px',
                  overflowY: 'auto',
                  marginBottom: '24px'
                }}>
                  {content ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                  ) : (
                    <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', paddingTop: '100px' }}>
                      Chưa có nội dung để hiển thị.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="neon-btn"
                disabled={isSubmitting}
              >
                <FileText size={18} />
                {isSubmitting ? 'Đang đăng tải...' : 'Đăng Bài Viết'}
              </button>
            </form>
          ) : (
            <div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tiêu Đề Bài Viết</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              {previewMode === 'edit' ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nội Dung Bài Viết (Hỗ trợ HTML)</label>
                  <textarea
                    rows={12}
                    required
                    className={styles.formInput}
                    style={{ resize: 'vertical', fontFamily: 'monospace' }}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>
              ) : (
                <div style={{
                  minHeight: '290px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid hsl(var(--border-glass))',
                  padding: '20px',
                  borderRadius: '12px',
                  overflowY: 'auto',
                  marginBottom: '24px'
                }}>
                  {editContent ? (
                    <div dangerouslySetInnerHTML={{ __html: editContent }} />
                  ) : (
                    <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', paddingTop: '100px' }}>
                      Chưa có nội dung để hiển thị.
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button onClick={() => handleUpdate(editingId)} className="neon-btn">
                  <Check size={18} />
                  Cập nhật
                </button>
                <button onClick={handleCancelEdit} className="neon-btn-secondary">
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="glass-panel" style={{ padding: '24px', fontSize: '0.9rem' }}>
          <h4 style={{ color: 'hsl(var(--text-primary))', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} style={{ color: 'hsl(var(--color-secondary))' }} />
            Hướng dẫn định dạng
          </h4>
          <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '12px' }}>
            Bạn có thể viết văn bản thông thường, hoặc nhúng mã HTML để tạo bài viết đẹp mắt hơn.
          </p>
          <ul style={{ color: 'hsl(var(--text-secondary))', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Sử dụng thẻ <code>&lt;p&gt;</code> cho các đoạn văn.</li>
            <li>Sử dụng thẻ <code>&lt;h3&gt;</code> hoặc <code>&lt;h4&gt;</code> cho tiêu đề mục.</li>
            <li>Có thể nhúng <code>&lt;iframe&gt;</code> để chèn video Youtube hoặc widget ngoài.</li>
            <li>Có thể chèn ảnh bằng thẻ <code>&lt;img src="..." alt="..." style="width:100%; border-radius:10px;"/&gt;</code>.</li>
          </ul>
        </div>
      </div>

      {/* Posts Table List */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ marginBottom: '20px', fontWeight: 700, fontSize: '1.25rem' }}>Các Bài Viết Đã Đăng</h3>

        {isLoading ? (
          <p style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '40px 0' }}>
            Đang tải danh sách bài viết...
          </p>
        ) : posts.length === 0 ? (
          <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center', padding: '40px 0' }}>
            Chưa có bài viết nào được đăng.
          </p>
        ) : (
          <div className={styles.tableContainer} style={{ marginTop: 0 }}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Tiêu đề bài viết</th>
                  <th>Đường dẫn (Slug)</th>
                  <th>Ngày đăng</th>
                  <th style={{ width: '100px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{post.title}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem' }}>/blog/{post.slug}</code>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(post.created_at).toLocaleDateString('vi-VN', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          onClick={() => handleStartEdit(post)}
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          title="Sửa"
                          disabled={editingId !== null}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Xóa"
                          disabled={editingId !== null}
                        >
                          <Trash2 size={18} />
                        </button>
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
