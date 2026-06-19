'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link2, Copy, Check, ArrowRight, ExternalLink, Clock, BarChart3 } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PasteButton from '@/components/PasteButton';
import { useAuth } from '@/components/AuthGuard';

interface HistoryItem {
  original: string;
  shortened: string;
  timestamp: number;
}

const STORAGE_KEY = 'shorten_history';

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ShortenPage() {
  const { user, requestAuth } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const todayCount = history.filter((item) => {
    const d = new Date(item.timestamp);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const handleShorten = useCallback(async () => {
    if (!user) {
      requestAuth();
      return;
    }
    setError('');
    setResult(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Vui lòng nhập URL.');
      return;
    }

    if (!isValidUrl(trimmed)) {
      setError('URL không hợp lệ. Vui lòng nhập URL bắt đầu bằng http:// hoặc https://');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Có lỗi xảy ra khi rút gọn URL.');
      }

      const data = await res.json();
      const shortened = data.shortenedUrl || data.shortened_url || data.url;
      setResult(shortened);

      const newItem: HistoryItem = {
        original: trimmed,
        shortened,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...history].slice(0, 50);
      setHistory(updated);
      saveHistory(updated);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [url, history]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="container">
      <Breadcrumbs />

      <section style={{ textAlign: 'center', padding: '40px 0 24px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'hsla(141, 55%, 42%, 0.1)',
            color: 'hsl(var(--color-success))',
            marginBottom: 16,
          }}
        >
          <Link2 size={32} />
        </div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'hsl(var(--text-primary))',
            marginBottom: 8,
          }}
        >
          Rút Gọn URL
        </h1>
        <p
          style={{
            color: 'hsl(var(--text-secondary))',
            fontSize: '1.05rem',
            maxWidth: 500,
            margin: '0 auto',
          }}
        >
          Chuyển đổi liên kết dài thành ngắn gọn, dễ chia sẻ.
        </p>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
          maxWidth: 600,
          margin: '0 auto 32px',
        }}
      >
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-glass))',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'hsla(var(--color-primary) / 0.1)',
              color: 'hsl(var(--color-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BarChart3 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              {history.length}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>Tổng số</div>
          </div>
        </div>
        <div
          style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-glass))',
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'hsla(var(--color-success) / 0.1)',
              color: 'hsl(var(--color-success))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              {todayCount}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>Hôm nay</div>
          </div>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ maxWidth: 640, margin: '0 auto 40px', padding: 32 }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <PasteButton onPaste={(text) => { setUrl(text); setError(''); }} style={{ marginTop: 1 }} />
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleShorten();
            }}
            placeholder="Nhập URL cần rút gọn..."
            style={{
              flex: 1,
              minWidth: 0,
              padding: '14px 18px',
              fontSize: '1rem',
              border: error
                ? '2px solid hsl(var(--color-danger))'
                : '2px solid hsl(var(--border-glass))',
              borderRadius: 10,
              background: 'hsl(var(--bg-card))',
              color: 'hsl(var(--text-primary))',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={(e) => {
              if (!error) {
                e.currentTarget.style.borderColor = 'hsl(var(--color-primary))';
                e.currentTarget.style.boxShadow = '0 0 0 3px hsla(var(--color-primary) / 0.12)';
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error
                ? 'hsl(var(--color-danger))'
                : 'hsl(var(--border-glass))';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          <button
            className="neon-btn"
            onClick={handleShorten}
            disabled={loading}
            style={{
              padding: '14px 28px',
              fontSize: '1rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Đang xử lý...
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Rút Gọn <ArrowRight size={18} />
              </span>
            )}
          </button>
        </div>

        {error && (
          <p
            style={{
              color: 'hsl(var(--color-danger))',
              fontSize: '0.9rem',
              marginTop: 12,
              fontWeight: 500,
            }}
          >
            {error}
          </p>
        )}

        {result && (
          <div
            style={{
              marginTop: 20,
              padding: '16px 20px',
              background: 'hsla(var(--color-success) / 0.06)',
              border: '1px solid hsla(var(--color-success) / 0.2)',
              borderRadius: 10,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                color: 'hsl(var(--color-success))',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Check size={18} />
              Rút gọn thành công!
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <a
                href={result}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '10px 14px',
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-glass))',
                  borderRadius: 8,
                  color: 'hsl(var(--color-primary))',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  wordBreak: 'break-all',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ExternalLink size={16} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{result}</span>
              </a>
              <button
                className="neon-btn-secondary"
                onClick={() => handleCopy(result)}
                style={{ padding: '10px 18px', fontSize: '0.9rem' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ maxWidth: 640, margin: '0 auto 80px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'hsl(var(--text-primary))',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Clock size={20} />
              Lịch sử rút gọn
            </h2>
            <button
              onClick={clearHistory}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--text-muted))',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 6,
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--color-danger))';
                e.currentTarget.style.background = 'hsla(var(--color-danger) / 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--text-muted))';
                e.currentTarget.style.background = 'none';
              }}
            >
              Xóa lịch sử
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map((item, i) => (
              <div
                key={item.timestamp + i}
                className="glass-panel"
                style={{
                  padding: '14px 18px',
                  animation: 'fadeIn 0.3s ease',
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.original}
                    >
                      {item.original}
                    </div>
                    <a
                      href={item.shortened}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'hsl(var(--color-primary))',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        wordBreak: 'break-all',
                      }}
                    >
                      <ExternalLink size={14} style={{ flexShrink: 0 }} />
                      {item.shortened}
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      className="neon-btn-secondary"
                      onClick={() => handleCopy(item.shortened)}
                      style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                    >
                      <Copy size={14} />
                    </button>
                    <a
                      href={item.shortened}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="neon-btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'hsl(var(--text-muted))',
                    marginTop: 8,
                  }}
                >
                  {new Date(item.timestamp).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
