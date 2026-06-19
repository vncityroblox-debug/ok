'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Key, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Suspense } from 'react';

function QuenMatKhauContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [step, setStep] = useState<'request' | 'reset'>(tokenFromUrl ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(tokenFromUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setStep('reset');
    }
  }, [tokenFromUrl]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Đã gửi liên kết đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư.');
      setIsLoading(false);
    } catch {
      setErrorMsg('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Đặt lại mật khẩu thành công! Đang chuyển hướng...');
      setTimeout(() => {
        window.location.href = '/dang-nhap';
      }, 1500);
    } catch {
      setErrorMsg('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Breadcrumbs />
      <section
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)',
          padding: '40px 0',
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '36px',
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-glass))',
            borderRadius: '0.5rem',
            boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'hsla(var(--color-primary) / 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              {step === 'request' ? (
                <Mail size={28} style={{ color: 'hsl(var(--color-primary))' }} />
              ) : (
                <Key size={28} style={{ color: 'hsl(var(--color-primary))' }} />
              )}
            </div>
            <h1
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                marginBottom: '6px',
                color: 'hsl(var(--text-primary))',
              }}
            >
              {step === 'request' ? 'Quên Mật Khẩu' : 'Đặt Lại Mật Khẩu'}
            </h1>
            <p
              style={{
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.95rem',
                textAlign: 'center',
              }}
            >
              {step === 'request'
                ? 'Nhập email để nhận liên kết đặt lại mật khẩu'
                : 'Nhập mã xác nhận và mật khẩu mới'}
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#16a34a',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '0.9rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Check size={16} />
              {successMsg}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequest}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="email"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border-glass))',
                    padding: '10px 14px',
                    borderRadius: '0.375rem',
                    color: 'hsl(var(--text-primary))',
                    outline: 'none',
                    fontSize: '0.9rem',
                    transition: 'var(--transition-smooth)',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = 'hsl(var(--color-primary))')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = 'hsl(var(--border-glass))')
                  }
                />
              </div>

              <button
                type="submit"
                className="neon-btn"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Đang gửi...' : 'Gửi Liên Kết Đặt Lại'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="token"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Mã Xác Nhận
                </label>
                <input
                  id="token"
                  type="text"
                  required
                  placeholder="Nhập mã xác nhận từ email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border-glass))',
                    padding: '10px 14px',
                    borderRadius: '0.375rem',
                    color: 'hsl(var(--text-primary))',
                    outline: 'none',
                    fontSize: '0.9rem',
                    transition: 'var(--transition-smooth)',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = 'hsl(var(--color-primary))')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = 'hsl(var(--border-glass))')
                  }
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="newPassword"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-glass))',
                      padding: '10px 42px 10px 14px',
                      borderRadius: '0.375rem',
                      color: 'hsl(var(--text-primary))',
                      outline: 'none',
                      fontSize: '0.9rem',
                      transition: 'var(--transition-smooth)',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'hsl(var(--color-primary))')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'hsl(var(--border-glass))')
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--text-muted))',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label
                  htmlFor="confirmPassword"
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: 'hsl(var(--text-primary))',
                  }}
                >
                  Xác nhận mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-glass))',
                      padding: '10px 42px 10px 14px',
                      borderRadius: '0.375rem',
                      color: 'hsl(var(--text-primary))',
                      outline: 'none',
                      fontSize: '0.9rem',
                      transition: 'var(--transition-smooth)',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = 'hsl(var(--color-primary))')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = 'hsl(var(--border-glass))')
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--text-muted))',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="neon-btn"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
              </button>
            </form>
          )}

          <p
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '0.9rem',
              color: 'hsl(var(--text-secondary))',
            }}
          >
            <Link
              href="/dang-nhap"
              style={{
                color: 'hsl(var(--color-primary))',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={14} />
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default function QuenMatKhauPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: '60px 0',
            textAlign: 'center',
            color: 'hsl(var(--text-secondary))',
          }}
        >
          Đang tải...
        </div>
      }
    >
      <QuenMatKhauContent />
    </Suspense>
  );
}
