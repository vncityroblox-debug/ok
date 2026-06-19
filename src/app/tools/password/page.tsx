'use client';

import { useState, useCallback, useEffect } from 'react';
import { Key, Copy, Check, RefreshCw, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/components/AuthGuard';

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

interface PasswordOption {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeChars: string;
  count: number;
}

function generatePassword(options: PasswordOption): string {
  let charset = '';
  if (options.uppercase) charset += CHARSETS.uppercase;
  if (options.lowercase) charset += CHARSETS.lowercase;
  if (options.numbers) charset += CHARSETS.numbers;
  if (options.symbols) charset += CHARSETS.symbols;

  if (!charset) charset = CHARSETS.lowercase;

  if (options.excludeChars) {
    charset = charset
      .split('')
      .filter((c) => !options.excludeChars.includes(c))
      .join('');
  }

  if (!charset) return '';

  let password = '';
  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  for (let i = 0; i < options.length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

function getStrength(password: string): {
  label: string;
  level: number;
  color: string;
  icon: typeof Shield;
} {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 24) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  const unique = new Set(password).size;
  if (unique >= 10) score++;

  if (score <= 3) return { label: 'Yếu', level: 1, color: 'hsl(4 82% 54%)', icon: ShieldAlert };
  if (score <= 5) return { label: 'Trung Bình', level: 2, color: 'hsl(38 92% 50%)', icon: Shield };
  if (score <= 7) return { label: 'Mạnh', level: 3, color: 'hsl(141 55% 42%)', icon: ShieldCheck };
  return { label: 'Rất Mạnh', level: 4, color: 'hsl(213 93% 52%)', icon: ShieldCheck };
}

export default function PasswordGeneratorPage() {
  const { user, requestAuth } = useAuth();
  const [options, setOptions] = useState<PasswordOption>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeChars: '',
    count: 5,
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = useCallback(() => {
    if (!user) {
      requestAuth();
      return;
    }
    const result: string[] = [];
    for (let i = 0; i < options.count; i++) {
      result.push(generatePassword(options));
    }
    setPasswords(result);
  }, [options]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = async (password: string, index: number) => {
    await navigator.clipboard.writeText(password);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const updateOption = <K extends keyof PasswordOption>(key: K, value: PasswordOption[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container">
      <Breadcrumbs />

      <section
        style={{
          textAlign: 'center',
          padding: '40px 0 30px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: 16,
            background: 'hsla(4 82% 54% / 0.1)',
            color: 'hsl(var(--color-danger))',
            marginBottom: 16,
          }}
        >
          <Key size={30} />
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Tạo <span style={{ color: 'hsl(var(--color-danger))' }}>Mật Khẩu</span>
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.05rem' }}>
          Tạo mật khẩu mạnh, an toàn với tùy chỉnh nâng cao
        </p>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: 24,
          alignItems: 'start',
          marginBottom: 60,
        }}
        className="pw-grid"
      >
        <div
          className="glass-panel"
          style={{ padding: 24 }}
        >
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Shield size={18} />
            Tùy Chỉnh
          </h2>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                Độ Dài
              </label>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'hsl(var(--color-primary))',
                }}
              >
                {options.length}
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={128}
              value={options.length}
              onChange={(e) => updateOption('length', Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: 'hsl(var(--color-primary))',
                height: 6,
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: 'hsl(var(--text-muted))',
                marginTop: 4,
              }}
            >
              <span>8</span>
              <span>128</span>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 500, fontSize: '0.9rem', display: 'block', marginBottom: 10 }}>
              Kiểu Ký Tự
            </label>
            {(
              [
                ['uppercase', 'Chữ Hoa (A-Z)'],
                ['lowercase', 'Chữ Thường (a-z)'],
                ['numbers', 'Số (0-9)'],
                ['symbols', 'Ký Tự Đặc Biệt (!@#...)'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="customCheckbox" style={{ marginBottom: 8, display: 'flex' }}>
                <input
                  type="checkbox"
                  checked={options[key]}
                  onChange={(e) => updateOption(key, e.target.checked)}
                />
                <span className="checkmark" />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 500, fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>
              Loại Ký Tự (Tùy Chọn)
            </label>
            <input
              type="text"
              value={options.excludeChars}
              onChange={(e) => updateOption('excludeChars', e.target.value)}
              placeholder="VD: @#$%"
              style={{ width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontWeight: 500, fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>
              Số Lượng
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 10, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => updateOption('count', n)}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    borderRadius: 8,
                    border: `1.5px solid ${options.count === n ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                    background: options.count === n ? 'hsla(var(--color-primary) / 0.08)' : 'hsl(var(--bg-card))',
                    color: options.count === n ? 'hsl(var(--color-primary))' : 'hsl(var(--text-secondary))',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'var(--transition-smooth)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="neon-btn"
            onClick={generate}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <RefreshCw size={16} />
            Tạo Lại
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {passwords.map((pw, i) => {
            const strength = getStrength(pw);
            const StrengthIcon = strength.icon;
            const isCopied = copiedIndex === i;

            return (
              <div
                key={i}
                className="glass-panel"
                style={{
                  padding: 20,
                  animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <StrengthIcon size={16} style={{ color: strength.color }} />
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: strength.color,
                      }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleCopy(pw, i)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: '1.5px solid hsl(var(--border-glass))',
                        background: isCopied
                          ? 'hsla(141 55% 42% / 0.1)'
                          : 'hsl(var(--bg-card))',
                        color: isCopied
                          ? 'hsl(var(--color-success))'
                          : 'hsl(var(--text-secondary))',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        transition: 'var(--transition-smooth)',
                      }}
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      {isCopied ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "'Courier New', 'Consolas', monospace",
                    fontSize: '1.15rem',
                    fontWeight: 600,
                    letterSpacing: '0.5px',
                    wordBreak: 'break-all',
                    padding: '10px 14px',
                    background: 'hsl(var(--bg-main))',
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border-light))',
                    lineHeight: 1.6,
                  }}
                >
                  {pw}
                </div>

                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: 'hsl(var(--bg-subtle))',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(strength.level / 4) * 100}%`,
                        background: strength.color,
                        borderRadius: 2,
                        transition: 'width 0.4s ease, background 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .pw-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
