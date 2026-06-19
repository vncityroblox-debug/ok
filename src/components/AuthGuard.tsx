'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  showAuth: boolean;
  requestAuth: () => void;
  hideAuth: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAuth: AuthContextType = {
  user: null,
  profile: null,
  loading: true,
  showAuth: false,
  requestAuth: () => {},
  hideAuth: () => {},
  refreshProfile: async () => {},
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) return defaultAuth;
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data || null);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    } else {
      setUser(null);
      setProfile(null);
    }
  }, [fetchProfile]);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const requestAuth = useCallback(() => setShowAuth(true), []);
  const hideAuth = useCallback(() => setShowAuth(false), []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, showAuth, requestAuth, hideAuth, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─────────────── AuthGuardModal ─────────────── */

export function AuthGuardModal() {
  const { showAuth, hideAuth, refreshProfile } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPw, setRegConfirmPw] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegConfirmPw, setShowRegConfirmPw] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (showAuth) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [showAuth]);

  useEffect(() => {
    if (showAuth) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAuth]);

  const resetState = () => {
    setTab('login');
    setLoginUsername('');
    setLoginPassword('');
    setRememberMe(false);
    setShowLoginPw(false);
    setLoginLoading(false);
    setLoginError('');
    setLoginSuccess('');
    setRegUsername('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPw('');
    setShowRegPw(false);
    setShowRegConfirmPw(false);
    setRegLoading(false);
    setRegError('');
    setRegSuccess('');
  };

  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => {
      hideAuth();
      resetState();
    }, 250);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (!loginUsername.trim()) {
      setLoginError('Vui lòng nhập tên tài khoản.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Đăng nhập thất bại.');
        setLoginLoading(false);
        return;
      }

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: loginPassword,
      });

      if (signInErr) {
        setLoginError('Sai mật khẩu.');
        setLoginLoading(false);
        return;
      }

      if (rememberMe) {
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `remember_me=${encodeURIComponent(loginUsername.trim())}; expires=${expires}; path=/; SameSite=Lax`;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (token) {
        fetch('/api/auth/log-login', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      await refreshProfile();
      setLoginSuccess('Đăng nhập thành công!');
      setTimeout(() => handleClose(), 600);
    } catch {
      setLoginError('Lỗi kết nối server.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regUsername.trim()) {
      setRegError('Vui lòng nhập tên tài khoản.');
      return;
    }
    if (!regEmail.trim()) {
      setRegError('Vui lòng nhập email.');
      return;
    }
    if (!regPassword) {
      setRegError('Vui lòng nhập mật khẩu.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPw) {
      setRegError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || 'Đăng ký thất bại.');
        setRegLoading(false);
        return;
      }

      // Auto-login
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: regEmail.trim(),
        password: regPassword,
      });

      if (signInErr) {
        setRegSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
        setTab('login');
        setLoginUsername(regUsername.trim());
        setRegLoading(false);
        return;
      }

      await refreshProfile();
      setRegSuccess('Đăng ký thành công!');
      setTimeout(() => handleClose(), 600);
    } catch {
      setRegError('Lỗi kết nối server.');
    } finally {
      setRegLoading(false);
    }
  };

  if (!showAuth) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(4px)',
    opacity: animateIn ? 1 : 0,
    transition: 'opacity 0.25s ease',
    padding: '20px',
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    background: 'hsl(var(--bg-card))',
    border: '1px solid hsl(var(--border-glass))',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    padding: '32px',
    maxHeight: '90vh',
    overflowY: 'auto',
    transform: animateIn ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 0',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2.5px solid hsl(var(--color-primary))' : '2.5px solid transparent',
    color: active ? 'hsl(var(--color-primary))' : 'hsl(var(--text-muted))',
    fontWeight: active ? 700 : 500,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRadius: 0,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid hsl(var(--border-glass))',
    background: 'hsl(var(--bg-card))',
    borderRadius: '10px',
    color: 'hsl(var(--text-primary))',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const pwInputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const pwToggleStyle: React.CSSProperties = {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'hsl(var(--text-muted))',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'hsl(var(--text-secondary))',
    marginBottom: '6px',
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const submitBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    background: 'hsl(var(--color-primary))',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background 0.2s, transform 0.1s',
    marginTop: '4px',
  };

  const errorBoxStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'hsla(var(--color-danger), 0.08)',
    border: '1px solid hsla(var(--color-danger), 0.2)',
    color: 'hsl(var(--color-danger))',
    fontSize: '0.88rem',
    marginBottom: '14px',
    lineHeight: 1.4,
  };

  const successBoxStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'hsla(var(--color-success), 0.08)',
    border: '1px solid hsla(var(--color-success), 0.2)',
    color: 'hsl(var(--color-success))',
    fontSize: '0.88rem',
    marginBottom: '14px',
    lineHeight: 1.4,
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={cardStyle}>
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid hsl(var(--border-light))',
            background: 'hsl(var(--bg-subtle))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'hsl(var(--text-muted))',
            transition: 'all 0.2s ease',
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'hsla(var(--color-danger), 0.1)';
            e.currentTarget.style.color = 'hsl(var(--color-danger))';
            e.currentTarget.style.borderColor = 'hsla(var(--color-danger), 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'hsl(var(--bg-subtle))';
            e.currentTarget.style.color = 'hsl(var(--text-muted))';
            e.currentTarget.style.borderColor = 'hsl(var(--border-light))';
          }}
        >
          <X size={16} />
        </button>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border-glass))', marginBottom: '24px', marginTop: '4px' }}>
          <button style={tabBtnStyle(tab === 'login')} onClick={() => { setTab('login'); setLoginError(''); setLoginSuccess(''); }}>
            <LogIn size={17} />
            Đăng Nhập
          </button>
          <button style={tabBtnStyle(tab === 'register')} onClick={() => { setTab('register'); setRegError(''); setRegSuccess(''); }}>
            <UserPlus size={17} />
            Đăng Ký
          </button>
        </div>

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            {loginError && <div style={errorBoxStyle}>{loginError}</div>}
            {loginSuccess && <div style={successBoxStyle}>{loginSuccess}</div>}

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Tên tài khoản</label>
              <input
                type="text"
                placeholder="Nhập tên tài khoản..."
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={inputStyle}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Mật khẩu</label>
              <div style={pwInputWrapperStyle}>
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '42px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw(!showLoginPw)}
                  style={pwToggleStyle}
                  tabIndex={-1}
                >
                  {showLoginPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <label className="customCheckbox" style={{ gap: '8px' }}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span className="checkmark" style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.88rem' }}>Ghi nhớ 30 ngày</span>
              </label>
              <a
                href="/forgot-password"
                style={{ fontSize: '0.85rem', color: 'hsl(var(--color-primary))', fontWeight: 500 }}
                onClick={(e) => {
                  e.preventDefault();
                  handleClose();
                  router.push('/forgot-password');
                }}
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                ...submitBtnStyle,
                opacity: loginLoading ? 0.7 : 1,
                cursor: loginLoading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loginLoading) e.currentTarget.style.background = 'hsl(var(--color-primary-hover))'; }}
              onMouseLeave={(e) => { if (!loginLoading) e.currentTarget.style.background = 'hsl(var(--color-primary))'; }}
            >
              {loginLoading ? (
                <>
                  <span style={{ width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authGuardSpin 0.6s linear infinite', display: 'inline-block' }} />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Đăng Nhập
                </>
              )}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            {regError && <div style={errorBoxStyle}>{regError}</div>}
            {regSuccess && <div style={successBoxStyle}>{regSuccess}</div>}

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Tên tài khoản</label>
              <input
                type="text"
                placeholder="3-30 ký tự, chữ, số, dấu gạch dưới"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                style={inputStyle}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Mật khẩu</label>
              <div style={pwInputWrapperStyle}>
                <input
                  type={showRegPw ? 'text' : 'password'}
                  placeholder="Ít nhất 6 ký tự"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '42px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPw(!showRegPw)}
                  style={pwToggleStyle}
                  tabIndex={-1}
                >
                  {showRegPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Xác nhận mật khẩu</label>
              <div style={pwInputWrapperStyle}>
                <input
                  type={showRegConfirmPw ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={regConfirmPw}
                  onChange={(e) => setRegConfirmPw(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '42px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPw(!showRegConfirmPw)}
                  style={pwToggleStyle}
                  tabIndex={-1}
                >
                  {showRegConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              style={{
                ...submitBtnStyle,
                opacity: regLoading ? 0.7 : 1,
                cursor: regLoading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
              }}
              onMouseEnter={(e) => { if (!regLoading) e.currentTarget.style.background = 'hsl(var(--color-primary-hover))'; }}
              onMouseLeave={(e) => { if (!regLoading) e.currentTarget.style.background = 'hsl(var(--color-primary))'; }}
            >
              {regLoading ? (
                <>
                  <span style={{ width: '18px', height: '18px', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'authGuardSpin 0.6s linear infinite', display: 'inline-block' }} />
                  Đang đăng ký...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Đăng Ký
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes authGuardSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
