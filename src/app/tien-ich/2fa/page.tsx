'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Copy, Trash2, Plus, Check } from 'lucide-react';
import {
  generateTOTP,
  getRemainingSeconds,
  isValidSecret,
  normalizeSecret,
  parseOtpAuthUri,
} from '@/lib/totp';
import styles from './twofa.module.css';

interface TwoFAAccount {
  id: string;
  name: string;
  secret: string;
}

const STORAGE_KEY = 'tienich_2fa_accounts';

function loadAccounts(): TwoFAAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TwoFAAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: TwoFAAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function TimerRing({ remaining, period }: { remaining: number; period: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / period;

  return (
    <div className={styles.timerRing}>
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="rgba(139, 92, 246, 0.15)"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="hsl(var(--color-primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className={styles.timerText}>{remaining}</span>
    </div>
  );
}

function AccountCard({
  account,
  remaining,
  onRemove,
}: {
  account: TwoFAAccount;
  remaining: number;
  onRemove: (id: string) => void;
}) {
  const [code, setCode] = useState('------');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function refreshCode() {
      const nextCode = await generateTOTP(account.secret);
      if (active && nextCode) setCode(nextCode);
    }

    refreshCode();
    return () => {
      active = false;
    };
  }, [account.secret, remaining]);

  const handleCopy = async () => {
    if (code === '------') return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={styles.accountCard}>
      <div className={styles.accountInfo}>
        <div className={styles.accountName}>{account.name}</div>
        <div className={styles.accountMeta}>Mã làm mới sau {remaining}s</div>
      </div>

      <div className={styles.codeBlock}>
        <div className={styles.codeValue}>{code}</div>
        <TimerRing remaining={remaining} period={30} />
        <button
          type="button"
          className={styles.iconBtn}
          onClick={handleCopy}
          aria-label="Sao chép mã"
          title="Sao chép mã"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => onRemove(account.id)}
          aria-label="Xóa tài khoản"
          title="Xóa tài khoản"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function TwoFAPage() {
  const [accounts, setAccounts] = useState<TwoFAAccount[]>([]);
  const [accountName, setAccountName] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    setAccounts(loadAccounts());
  }, []);

  useEffect(() => {
    const tick = () => setRemaining(getRemainingSeconds());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const persistAccounts = useCallback((next: TwoFAAccount[]) => {
    setAccounts(next);
    saveAccounts(next);
  }, []);

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedInput = secretInput.trim();
    if (!trimmedInput) {
      setError('Vui lòng nhập secret key hoặc link otpauth.');
      return;
    }

    let name = accountName.trim();
    let secret = normalizeSecret(trimmedInput);

    const parsed = parseOtpAuthUri(trimmedInput);
    if (parsed) {
      secret = parsed.secret;
      if (!name) name = parsed.label || parsed.issuer || 'Tài khoản 2FA';
    }

    if (!name) {
      setError('Vui lòng nhập tên tài khoản.');
      return;
    }

    if (!isValidSecret(secret)) {
      setError('Secret key không hợp lệ. Secret phải là chuỗi Base32 (A-Z, 2-7).');
      return;
    }

    const exists = accounts.some((item) => item.secret === secret);
    if (exists) {
      setError('Secret key này đã được thêm.');
      return;
    }

    const nextAccount: TwoFAAccount = {
      id: crypto.randomUUID(),
      name,
      secret,
    };

    persistAccounts([nextAccount, ...accounts]);
    setAccountName('');
    setSecretInput('');
  };

  const handleRemoveAccount = (id: string) => {
    persistAccounts(accounts.filter((item) => item.id !== id));
  };

  return (
    <div className="container">
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Tiện Ích <span>Lấy 2FA</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Tạo mã xác thực 2 bước (TOTP) ngay trên trình duyệt. Dán secret key hoặc link otpauth:// để lấy mã 6 số, tự động làm mới mỗi 30 giây.
        </p>
      </section>

      <div className={styles.layout}>
        <form onSubmit={handleAddAccount} className={`glass-panel ${styles.formPanel}`}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} style={{ color: 'hsl(var(--color-primary))' }} />
            Thêm Tài Khoản
          </h2>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="accountName">
              Tên tài khoản
            </label>
            <input
              id="accountName"
              type="text"
              className={styles.formInput}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ví dụ: Gmail, Facebook, GitHub..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="secretInput">
              Secret Key / Link otpauth
            </label>
            <textarea
              id="secretInput"
              rows={4}
              className={styles.formInput}
              style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.88rem' }}
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Dán secret key Base32 hoặc otpauth://totp/..."
            />
            <p className={styles.formHint}>
              Secret thường có dạng <code>JBSWY3DPEHPK3PXP</code> hoặc link <code>otpauth://totp/...</code> khi bạn bật 2FA.
            </p>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}

          <button type="submit" className="neon-btn">
            <ShieldCheck size={18} />
            Thêm & Lấy Mã
          </button>

          <div className={styles.notice}>
            Mã chỉ được tạo trên trình duyệt của bạn và lưu cục bộ (localStorage). Không gửi secret lên server.
          </div>
        </form>

        <div className={`glass-panel ${styles.listPanel}`}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>
            Danh Sách Mã 2FA
          </h2>

          {accounts.length === 0 ? (
            <div className={styles.emptyState}>
              Chưa có tài khoản nào. Thêm secret key bên trái để bắt đầu lấy mã 2FA.
            </div>
          ) : (
            <div className={styles.accountList}>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  remaining={remaining}
                  onRemove={handleRemoveAccount}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
