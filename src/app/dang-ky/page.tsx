'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Breadcrumbs from '@/components/Breadcrumbs';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function DangKyPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        setIsLoading(false);
        return;
      }

      setSuccessMsg('Đăng ký thành công! Đang đăng nhập...');
      await new Promise((r) => setTimeout(r, 800));

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setErrorMsg('Đăng ký thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập thủ công.');
        setIsLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) {
        fetch('/api/auth/log-login', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      router.push('/');
      router.refresh();
    } catch {
      setErrorMsg('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Breadcrumbs />
      <section style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '40px 0',
      }}>
        <div className="glass-panel" style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px',
          background: 'hsl(var(--bg-card))',
          border: '1px solid hsl(var(--border-glass))',
          borderRadius: '0.5rem',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '28px',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'hsla(var(--color-primary) / 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <UserPlus size={28} style={{ color: 'hsl(var(--color-primary))' }} />
            </div>
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              marginBottom: '6px',
              color: 'hsl(var(--text-primary))',
            }}>
              Tạo Tài Khoản
            </h1>
            <p style={{
              color: 'hsl(var(--text-secondary))',
              fontSize: '0.95rem',
              textAlign: 'center',
            }}>
              Đăng ký tài khoản mới để sử dụng các tính năng
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
              fontSize: '0.9rem',
              textAlign: 'center',
            }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: '#16a34a',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              textAlign: 'center',
            }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'hsl(var(--text-primary))',
              }} htmlFor="username">
                Tên Tài Khoản
              </label>
              <input
                id="username"
                type="text"
                required
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
                }}
                placeholder="username_example"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'hsl(var(--text-primary))',
              }} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
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
                }}
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'hsl(var(--text-primary))',
              }} htmlFor="password">
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
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
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
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
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: 'hsl(var(--text-primary))',
              }} htmlFor="confirmPassword">
                Nhập Lại Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
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
                  }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
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
              {isLoading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.9rem',
            color: 'hsl(var(--text-secondary))',
          }}>
            Đã có tài khoản?{' '}
            <Link
              href="/dang-nhap"
              style={{
                color: 'hsl(var(--color-primary))',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
