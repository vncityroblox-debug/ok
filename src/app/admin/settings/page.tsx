'use client';

import { useState, useEffect } from 'react';
import { Save, Link2, Megaphone, LayoutTemplate } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminSettings() {
  const [siteName, setSiteName] = useState('');
  const [siteIconUrl, setSiteIconUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoTags, setSeoTags] = useState('');
  const [seoThumbnailUrl, setSeoThumbnailUrl] = useState('');
  const [footerText, setFooterText] = useState('');
  const [theme, setTheme] = useState('light');
  const [termsContent, setTermsContent] = useState('');
  const [link4mToken, setLink4mToken] = useState('');
  const [announcementHtml, setAnnouncementHtml] = useState('');
  const [homeHeroTitle, setHomeHeroTitle] = useState('');
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/query?type=settings');
        const json = await res.json();
        if (json.data) {
          setSiteName(json.data.site_name || '');
          setSiteIconUrl(json.data.site_icon_url || '');
          setSeoTitle(json.data.seo_title || '');
          setSeoDescription(json.data.seo_description || '');
          setSeoTags(json.data.seo_tags ? json.data.seo_tags.join(', ') : '');
          setSeoThumbnailUrl(json.data.seo_thumbnail_url || '');
          setFooterText(json.data.footer_text || '');
          setTheme(json.data.theme || 'light');
          setTermsContent(json.data.terms_content || '');
          setLink4mToken(json.data.link4m_api_token || '');
          setAnnouncementHtml(json.data.announcement_html || '');
          setHomeHeroTitle(json.data.home_hero_title || 'Kho Tài Nguyên|Tuyển Chọn');
          setHomeHeroSubtitle(
            json.data.home_hero_subtitle ||
              'Khám phá và tải xuống hàng loạt ứng dụng, mã nguồn, công cụ tiện ích và tài nguyên công nghệ tốt nhất hoàn toàn miễn phí.'
          );
        }
      } catch (err) {
        console.error('Settings load error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    // Parse comma-separated tags into array
    const tagsArray = seoTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '');

    try {
      const res = await fetch('/api/admin/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: 'settings',
          action: 'upsert',
          data: {
            site_name: siteName.trim(),
            site_icon_url: siteIconUrl.trim(),
            seo_title: seoTitle.trim(),
            seo_description: seoDescription.trim(),
            seo_tags: tagsArray,
            seo_thumbnail_url: seoThumbnailUrl.trim(),
            footer_text: footerText.trim(),
            theme: theme,
            terms_content: termsContent.trim(),
            link4m_api_token: link4mToken.trim(),
            announcement_html: announcementHtml,
            home_hero_title: homeHeroTitle.trim(),
            home_hero_subtitle: homeHeroSubtitle.trim(),
          }
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      setMessage({ text: 'Cấu hình website đã được lưu thành công!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: `Lỗi khi lưu cấu hình: ${err.message || err}`, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải cấu hình website...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          Cấu Hình Hệ Thống & SEO
        </h1>
        <p className={styles.pageSubtitle}>
          Thay đổi thương hiệu, biểu tượng và các thẻ SEO hỗ trợ tìm kiếm trên Google
        </p>
      </div>

      {message.text && (
        <div style={{
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '28px',
          fontSize: '0.95rem'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="siteName">Tên Website</label>
            <input
              id="siteName"
              type="text"
              required
              className={styles.formInput}
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Ví dụ: TienIchApp"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="siteIcon">Icon Website (URL Hình)</label>
            <input
              id="siteIcon"
              type="url"
              className={styles.formInput}
              value={siteIconUrl}
              onChange={(e) => setSiteIconUrl(e.target.value)}
              placeholder="https://link-to-icon.png"
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />

        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <LayoutTemplate size={18} style={{ color: 'hsl(var(--color-primary))' }} />
            Hero Trang Chủ
          </h4>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            Tiêu đề và mô tả hiển thị ở đầu trang chủ. Dùng dấu <strong>|</strong> trong tiêu đề để tách phần chữ gradient, ví dụ: <code>Kho Tài Nguyên|Tuyển Chọn</code>
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="homeHeroTitle">Tiêu Đề Trang Chủ</label>
          <input
            id="homeHeroTitle"
            type="text"
            required
            className={styles.formInput}
            value={homeHeroTitle}
            onChange={(e) => setHomeHeroTitle(e.target.value)}
            placeholder="Kho Tài Nguyên|Tuyển Chọn"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="homeHeroSubtitle">Mô Tả Trang Chủ</label>
          <textarea
            id="homeHeroSubtitle"
            rows={3}
            required
            className={styles.formInput}
            style={{ resize: 'vertical' }}
            value={homeHeroSubtitle}
            onChange={(e) => setHomeHeroSubtitle(e.target.value)}
            placeholder="Khám phá và tải xuống hàng loạt ứng dụng..."
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="seoTitle">Tiêu Đề Tìm Kiếm (SEO Title)</label>
          <input
            id="seoTitle"
            type="text"
            required
            className={styles.formInput}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="Tiêu đề hiển thị trên Google search"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="seoDesc">Mô Tả Web (SEO Description)</label>
          <textarea
            id="seoDesc"
            rows={3}
            className={styles.formInput}
            style={{ resize: 'vertical' }}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="Mô tả tóm tắt nội dung trang web hiển thị trên Google search"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="seoTags">Thẻ Tags (SEO Keywords)</label>
            <input
              id="seoTags"
              type="text"
              className={styles.formInput}
              value={seoTags}
              onChange={(e) => setSeoTags(e.target.value)}
              placeholder="Ngăn cách bằng dấu phẩy: app, games, keys"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="seoThumbnail">Hình Thumbnail Chia Sẻ (URL)</label>
            <input
              id="seoThumbnail"
              type="url"
              className={styles.formInput}
              value={seoThumbnailUrl}
              onChange={(e) => setSeoThumbnailUrl(e.target.value)}
              placeholder="https://link-to-thumbnail.jpg"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="footerText">Bản Quyền / Thương Hiệu Chân Trang</label>
            <input
              id="footerText"
              type="text"
              className={styles.formInput}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Ví dụ: Vercel & Supabase hoặc Tên Của Bạn"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="themeSelect">Giao Diện Mặc Định</label>
            <select
              id="themeSelect"
              className={styles.formInput}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={{ backgroundColor: 'hsl(var(--bg-card))' }}
            >
              <option value="light">Màu Sáng (Light Mode)</option>
              <option value="dark">Màu Tối (Dark Mode)</option>
            </select>
          </div>
        </div>

        <div className={styles.formGroup} style={{ marginTop: '20px' }}>
          <label className={styles.formLabel} htmlFor="termsContent">Nội Dung Điều Khoản Tải Xuống (Hỗ trợ xuống dòng)</label>
          <textarea
            id="termsContent"
            rows={6}
            className={styles.formInput}
            style={{ resize: 'vertical' }}
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            placeholder="Nhập điều khoản người dùng phải đồng ý trước khi tải..."
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />

        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Megaphone size={18} style={{ color: 'hsl(var(--color-accent, var(--color-primary)))' }} />
            Thông Báo Popup
          </h4>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            Nội dung HTML sẽ hiện popup khi người dùng truy cập trang chủ. Để trống nếu không muốn hiện thông báo. Hỗ trợ nhúng HTML đầy đủ (thẻ &lt;img&gt;, &lt;a&gt;, &lt;b&gt;, &lt;iframe&gt;...).
          </p>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="announcementHtml">Nội Dung Thông Báo (HTML)</label>
          <textarea
            id="announcementHtml"
            rows={8}
            className={styles.formInput}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.88rem' }}
            value={announcementHtml}
            onChange={(e) => setAnnouncementHtml(e.target.value)}
            placeholder='Ví dụ: <h2>🎉 Chào mừng!</h2><p>Website đã <b>cập nhật</b> phiên bản mới.</p>'
          />
        </div>
        {announcementHtml.trim() && (
          <div style={{ marginBottom: '20px' }}>
            <label className={styles.formLabel}>Xem Trước Thông Báo</label>
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.05)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              lineHeight: 1.7,
              color: 'hsl(var(--text-primary))',
            }} dangerouslySetInnerHTML={{ __html: announcementHtml }} />
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />

        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link2 size={18} style={{ color: 'hsl(var(--color-primary))' }} />
            Cấu Hình Rút Gọn Link (Link4M)
          </h4>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            API Token để tự động rút gọn link tải về qua <strong>link4m.co</strong>. Lấy token tại trang quản lý Link4M của bạn.
          </p>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="link4mToken">Link4M API Token</label>
          <input
            id="link4mToken"
            type="text"
            className={styles.formInput}
            value={link4mToken}
            onChange={(e) => setLink4mToken(e.target.value)}
            placeholder="Ví dụ: 66628893d41d933b781a2c50"
          />
        </div>

        <button
          type="submit"
          className="neon-btn"
          style={{ marginTop: '20px' }}
          disabled={isSaving}
        >
          <Save size={18} />
          {isSaving ? 'Đang lưu cấu hình...' : 'Lưu Thay Đổi'}
        </button>
      </form>
    </div>
  );
}
