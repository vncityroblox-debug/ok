'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import ImageLightbox from '@/components/ImageLightbox';
import { supabase } from '@/lib/supabase';
import { Lock, Unlock, Download, KeyRound, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import styles from '../../home.module.css';

interface AppDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  main_image_url: string;
  detail_images: string[];
  download_link: string;
  is_locked: boolean;
  categories: { name: string } | null;
}

export default function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [app, setApp] = useState<AppDetails | null>(null);
  const [keyInput, setKeyInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [termsContent, setTermsContent] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { user, requestAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadAppDetails() {
      setIsLoading(true);
      try {
        const { fetchPublicAppBySlug } = await import('@/lib/public-fetch');
        const { app: appData, settings } = await fetchPublicAppBySlug(slug);

        if (!appData) {
          setErrorMessage('Không tìm thấy ứng dụng yêu cầu.');
        } else {
          setApp(appData);
        }

        if (settings?.terms_content) {
          setTermsContent(settings.terms_content);
        } else {
          setTermsAccepted(true);
        }
      } catch (err) {
        console.error('App load error:', err);
        setErrorMessage('Lỗi hệ thống khi tải ứng dụng.');
      } finally {
        setIsLoading(false);
      }
    }

    loadAppDetails();
  }, [slug]);

  const handleDownload = async () => {
    if (!app) return;
    if (!user) {
      requestAuth();
      setIsVerifying(false);
      return;
    }
    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          appId: app.id,
          key: app.is_locked ? keyInput : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || 'Có lỗi xảy ra khi xác thực Key.');
        setIsVerifying(false);
        return;
      }

      setSuccessMessage('Tải xuống thành công! Đang chuyển đến lịch sử đơn hàng...');
      setKeyInput('');
      
      window.open(result.downloadLink, '_blank');
      router.push('/profile');
    } catch (err) {
      setErrorMessage('Lỗi kết nối server. Vui lòng thử lại.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải thông tin chi tiết ứng dụng...</p>
      </div>
    );
  }

  if (errorMessage && !app) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2 style={{ marginBottom: '20px' }}>{errorMessage}</h2>
        <Link href="/" className="neon-btn">
          <ArrowLeft size={16} /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="container" style={{ padding: '20px 24px', position: 'relative' }}>
      <Breadcrumbs />
      {/* Terms Popup */}
      {showTermsPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '30px', position: 'relative' }}>
            <button 
              onClick={() => setShowTermsPopup(false)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px' }}>Điều Khoản Tải Xuống</h2>
            
            <div 
              style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', marginBottom: '20px', whiteSpace: 'pre-wrap', color: 'hsl(var(--text-secondary))', lineHeight: 1.6 }}
            >
              {termsContent}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button 
                className="neon-btn" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsPopup(false);
                }}
              >
                Tôi Đã Đọc Và Đồng Ý
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.appDetailLayout}>
        {/* Main Details Panel */}
        <div className={`${styles.detailCard} glass-panel`}>
          <div className={styles.detailHeader}>
            <img
              src={app.main_image_url}
              alt={app.name}
              className={styles.detailIcon}
              onClick={() => setLightboxIndex(0)}
              style={{ cursor: 'zoom-in' }}
            />
            <div className={styles.detailInfo}>
              <h1>{app.name}</h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
                <span style={{
                  background: 'hsl(var(--bg-subtle))',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: 'hsl(var(--text-secondary))'
                }}>
                  {app.categories?.name || 'Không xác định'}
                </span>
                
                <span style={{
                  background: app.is_locked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: app.is_locked ? '#ef4444' : '#10b981',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {app.is_locked ? <Lock size={14} /> : <Unlock size={14} />}
                  {app.is_locked ? 'Đang Khóa' : 'Tải Miễn Phí'}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid hsl(var(--border-glass))', margin: '30px 0' }} />

          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'hsl(var(--text-primary))' }}>
              Giới thiệu ứng dụng
            </h3>
            <p style={{ color: 'hsl(var(--text-secondary))', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {app.description}
            </p>
          </div>

          {/* Screenshots Grid (if any) */}
          {app.detail_images && app.detail_images.length > 0 && (
            <div className={styles.screenshotsSection}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'hsl(var(--text-primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} />
                Hình ảnh chi tiết
              </h3>
              <div className={styles.screenshotsGrid}>
                {app.detail_images.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt={`${app.name} screenshot ${index + 1}`}
                    className={styles.screenshotImg}
                    onClick={() => setLightboxIndex(index + 1)}
                    style={{ cursor: 'zoom-in' }}
                  />
                ))}
              </div>
            </div>
          )}

          {lightboxIndex !== null && (
            <ImageLightbox
              images={app.detail_images && app.detail_images.length > 0
                ? [app.main_image_url, ...app.detail_images]
                : [app.main_image_url]}
              initialIndex={lightboxIndex}
              alt={app.name}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </div>

        {/* Download Box */}
        <div>
          <div className={`${styles.downloadBox} glass-panel`}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: app.is_locked ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                border: app.is_locked ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(139,92,246,0.2)',
                color: app.is_locked ? '#ef4444' : 'hsl(var(--color-primary))',
              }}
            >
              {app.is_locked ? <Lock size={24} /> : <Download size={24} />}
            </div>

            <h3 className={styles.downloadTitle}>Tải Xuống Ứng Dụng</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '24px' }}>
              {app.is_locked
                ? 'Ứng dụng này đã được cấu hình khóa bảo mật. Bạn cần có Key hợp lệ để tải về.'
                : 'Ứng dụng mở hoàn toàn. Bấm Tải xuống bên dưới để bắt đầu tải file.'}
            </p>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '12px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                textAlign: 'left'
              }}>
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '10px 14px',
                borderRadius: '12px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                textAlign: 'left'
              }}>
                {successMessage}
              </div>
            )}

            {/* Input Key if Locked */}
            {app.is_locked && (
              <div className={styles.formGroup} style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label className={styles.formLabel} htmlFor="keyInput" style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Nhập Key Tải Về
                </label>
                <div className="keyInputWrapper">
                  <KeyRound size={18} className="keyInputIcon" />
                  <input
                    id="keyInput"
                    type="text"
                    className="keyInput"
                    placeholder="Nhập mã key..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    disabled={isVerifying || (!!termsContent && !termsAccepted)}
                  />
                </div>
              </div>
            )}

            {/* Terms Checkbox */}
            {termsContent && (
              <div className={styles.formGroup} style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label className="customCheckbox" style={{ alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={() => {
                      if (!termsAccepted) {
                        setShowTermsPopup(true);
                      } else {
                        setTermsAccepted(false);
                      }
                    }}
                  />
                  <span className="checkmark" style={{ marginTop: '2px' }} />
                  <span style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Tôi đã đọc và đồng ý với <span style={{ color: 'hsl(var(--color-primary))', textDecoration: 'underline' }}>Điều khoản tải xuống</span>
                  </span>
                </label>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="neon-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={isVerifying || (!!termsContent && !termsAccepted)}
            >
              <Download size={18} />
              {isVerifying ? 'Đang xác thực...' : app.is_locked ? 'Nhập Key & Tải Về' : 'Tải Xuống Ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
