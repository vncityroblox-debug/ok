'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { supabase } from '@/lib/supabase';

function DangNhapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      const { email } = data;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message === 'Invalid login credentials'
            ? 'Mật khẩu không chính xác.'
            : error.message
        );
        setIsLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (adminData) {
          router.push('/admin');
        } else {
          router.push(redirectTo);
        }
        router.refresh();
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
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
        }}
      >
        <div
          className="glass-panel"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '40px 32px',
            borderRadius: '20px',
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
                borderRadius: '16px',
                background: 'hsla(var(--color-primary) / 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <LogIn size={26} style={{ color: 'hsl(var(--color-primary))' }} />
            </div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                marginBottom: '6px',
                textAlign: 'center',
              }}
            >
              Đăng Nhập
            </h1>
            <p
              style={{
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.95rem',
                textAlign: 'center',
              }}
            >
              Chào mừng bạn quay trở lại!
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

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="username"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                Tên Tài Khoản
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder="Nhập tên tài khoản"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border-glass))',
                  background: 'hsl(var(--bg-secondary))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor =
                    'hsl(var(--color-primary))')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor =
                    'hsl(var(--border-glass))')
                }
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 14px',
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border-glass))',
                    background: 'hsl(var(--bg-secondary))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor =
                      'hsl(var(--color-primary))')
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor =
                      'hsl(var(--border-glass))')
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--text-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '28px',
              }}
            >
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'hsl(var(--color-primary))',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="remember_me"
                style={{
                  fontSize: '0.9rem',
                  color: 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                }}
              >
                Ghi nhớ đăng nhập trong 30 ngày
              </label>
            </div>

            <button
              type="submit"
              className="neon-btn"
              style={{ width: '100%', justifyContent: 'center', marginBottom: '20px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.9rem',
            }}
          >
            <Link
              href="/quen-mat-khau"
              style={{
                color: 'hsl(var(--color-primary))',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Quên mật khẩu?
            </Link>
            <span style={{ color: 'hsl(var(--text-muted))' }}>
              Chưa có tài khoản?{' '}
              <Link
                href="/dang-ky"
                style={{
                  color: 'hsl(var(--color-primary))',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Đăng ký
              </Link>
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DangNhapPage() {
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
      <DangNhapContent />
    </Suspense>
  );
}
