'use client';

import { useState, useEffect } from 'react';
import { Save, Link2, Megaphone, LayoutTemplate, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '../admin.module.css';

export default function AdminSettings() {
  const [siteName, setSiteName] = useState('');
  const [siteIconUrl, setSiteIconUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
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
  
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailMsg, setTestEmailMsg] = useState({ text: '', type: '' as '' | 'success' | 'error' });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
        if (error || !data) throw new Error(error?.message || 'No data');
        setSiteName(data.site_name || '');
        setSiteIconUrl(data.site_icon_url || '');
        setFaviconUrl(data.favicon_url || '');
        setSeoTitle(data.seo_title || '');
        setSeoDescription(data.seo_description || '');
        setSeoTags(data.seo_tags ? data.seo_tags.join(', ') : '');
        setSeoThumbnailUrl(data.seo_thumbnail_url || '');
        setFooterText(data.footer_text || '');
        setTheme(data.theme || 'light');
        setTermsContent(data.terms_content || '');
        setLink4mToken(data.link4m_api_token || '');
        setAnnouncementHtml(data.announcement_html || '');
        setHomeHeroTitle(data.home_hero_title || 'Kho Tài Nguyên|Tuyển Chọn');
        setHomeHeroSubtitle(
          data.home_hero_subtitle ||
            'Khám phá và tải xuống hàng loạt ứng dụng, mã nguồn, công cụ tiện ích và tài nguyên công nghệ tốt nhất hoàn toàn miễn phí.'
        );
        setSmtpHost(data.smtp_host || '');
        setSmtpPort(data.smtp_port || '587');
        setSmtpUser(data.smtp_user || '');
        setSmtpPass(data.smtp_pass || '');
        setSmtpFrom(data.smtp_from || '');
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
      const { error } = await supabase.from('site_settings').upsert({
        id: 1,
        site_name: siteName.trim(),
        site_icon_url: siteIconUrl.trim(),
        favicon_url: faviconUrl.trim(),
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
        smtp_host: smtpHost.trim(),
        smtp_port: smtpPort.trim(),
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass.trim(),
        smtp_from: smtpFrom.trim(),
      });
      if (error) throw new Error(error.message);
      
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

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="faviconIcon">Favicon (Icon Tab, URL)</label>
            <input
              id="faviconIcon"
              type="url"
              className={styles.formInput}
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://link-to-favicon.ico"
            />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border-glass))', margin: '20px 0' }} />

        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <LayoutTemplate size={18} style={{ color: 'hsl(var(--color-primary))' }} />
            Hero Trang Chủ
          </h4>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            Tiêu đề và mô tả hiển thị ở đầu trang chủ. Tiêu đề dùng dấu <strong>|</strong> để tách phần chữ gradient, ví dụ: <code>Kho Tài Nguyên|Tuyển Chọn</code>. Mô tả hỗ trợ nhúng HTML đầy đủ (thẻ &lt;b&gt;, &lt;a&gt;, &lt;br&gt;, &lt;span&gt;...).
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
          <label className={styles.formLabel} htmlFor="homeHeroSubtitle">Mô Tả Trang Chủ (Hỗ trợ HTML)</label>
          <textarea
            id="homeHeroSubtitle"
            rows={3}
            required
            className={styles.formInput}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.88rem' }}
            value={homeHeroSubtitle}
            onChange={(e) => setHomeHeroSubtitle(e.target.value)}
            placeholder="Khám phá và tải xuống hàng loạt ứng dụng..."
          />
        </div>
        {homeHeroSubtitle.trim() && (
          <div style={{ marginBottom: '20px' }}>
            <label className={styles.formLabel}>Xem Trước Mô Tả</label>
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(13, 110, 253, 0.05)',
              border: '1px solid rgba(13, 110, 253, 0.2)',
              lineHeight: 1.7,
              color: 'hsl(var(--text-primary))',
            }} dangerouslySetInnerHTML={{ __html: homeHeroSubtitle }} />
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border-glass))', margin: '20px 0' }} />

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

        <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border-glass))', margin: '20px 0' }} />

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

        <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border-glass))', margin: '20px 0' }} />

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

        <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border-glass))', margin: '20px 0' }} />

        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Mail size={18} style={{ color: 'hsl(var(--color-primary))' }} />
            Cấu Hình Email (SMTP)
          </h4>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            Cấu hình SMTP để hệ thống gửi email đặt lại mật khẩu và thông báo. Nên dùng Gmail App Password hoặc dịch vụ email chuyên dụng.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="smtpHost">SMTP Host</label>
            <input
              id="smtpHost"
              type="text"
              className={styles.formInput}
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="smtpPort">SMTP Port</label>
            <input
              id="smtpPort"
              type="text"
              className={styles.formInput}
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="smtpUser">SMTP Username / Email</label>
            <input
              id="smtpUser"
              type="text"
              className={styles.formInput}
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="your-email@gmail.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="smtpPass">SMTP Password / App Password</label>
            <input
              id="smtpPass"
              type="password"
              className={styles.formInput}
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="smtpFrom">SMTP From Name / Email</label>
          <input
            id="smtpFrom"
            type="text"
            className={styles.formInput}
            value={smtpFrom}
            onChange={(e) => setSmtpFrom(e.target.value)}
            placeholder="your-email@gmail.com hoặc Tên Website <email@gmail.com>"
          />
        </div>

        {/* Test email section */}
        <div style={{
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-glass))',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '12px',
        }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={14} />
            Thử Gửi Email
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className={styles.formGroup} style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <input
                type="email"
                className={styles.formInput}
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="Địa chỉ email nhận thử"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
            <button
              type="button"
              className="neon-btn"
              style={{ fontSize: '0.85rem', padding: '8px 16px', marginBottom: 0, whiteSpace: 'nowrap' }}
              disabled={isSendingTest || !testEmailTo.trim()}
              onClick={async () => {
                setIsSendingTest(true);
                setTestEmailMsg({ text: '', type: '' });
                try {
                  const { data: sessionData } = await supabase.auth.getSession();
                  const token = sessionData?.session?.access_token;
                  const res = await fetch('/api/admin/test-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ to: testEmailTo.trim() }),
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || 'Lỗi gửi email');
                  setTestEmailMsg({ text: json.message || 'Gửi thành công!', type: 'success' });
                } catch (err: any) {
                  setTestEmailMsg({ text: err.message || 'Lỗi gửi email.', type: 'error' });
                } finally {
                  setIsSendingTest(false);
                }
              }}
            >
              {isSendingTest ? 'Đang gửi...' : 'Gửi Thử'}
            </button>
          </div>
          {testEmailMsg.text && (
            <p style={{
              marginTop: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: testEmailMsg.type === 'success' ? '#10b981' : '#ef4444',
            }}>
              {testEmailMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              {testEmailMsg.text}
            </p>
          )}
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
