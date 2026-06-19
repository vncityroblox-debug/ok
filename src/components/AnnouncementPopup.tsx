'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DISMISS_KEY = 'announcement_dismissed_at';
const DISMISS_DURATION_MS = 60 * 60 * 1000; // 1 giờ

export default function AnnouncementPopup() {
  const [html, setHtml] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Kiểm tra đã ẩn chưa (1h)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION_MS) return; // vẫn trong thời gian ẩn
    }

    // Fetch thông báo từ site_settings
    async function loadAnnouncement() {
      try {
        const { fetchAnnouncement } = await import('@/lib/public-fetch');
        const data = await fetchAnnouncement();

        if (data?.announcement_html && data.announcement_html.trim() !== '') {
          setHtml(data.announcement_html);
          setTimeout(() => setVisible(true), 800);
        }
      } catch (err) {
        console.error('Failed to load announcement:', err);
      }
    }

    loadAnnouncement();
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  if (!visible || !html) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          animation: 'popupFadeIn 0.3s ease',
        }}
      />

      {/* Popup */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        width: '90%',
        maxWidth: '560px',
        maxHeight: '80vh',
        background: 'hsl(var(--bg-card))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.15)',
        overflow: 'hidden',
        animation: 'popupSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '1.4rem' }}>📢</span>
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'hsl(var(--text-primary))' }}>
              Thông Báo
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            title="Đóng (ẩn 1 giờ)"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer', color: 'hsl(var(--text-secondary))',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = 'hsl(var(--text-secondary))';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body – render HTML nội dung thông báo */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 130px)',
            color: 'hsl(var(--text-primary))',
            lineHeight: 1.7,
            fontSize: '0.95rem',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Footer */}
        <div style={{
          padding: '12px 24px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={handleDismiss}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Đã hiểu, đóng lại
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupSlideIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
