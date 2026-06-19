'use client';

import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  Database,
  Copy,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  RefreshCw,
  Download,
} from 'lucide-react';

type Category = 'personal' | 'business' | 'financial' | 'internet' | 'vietnamese';

const CATEGORIES: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'business', label: 'Business', icon: Database },
  { key: 'financial', label: 'Financial', icon: CreditCard },
  { key: 'internet', label: 'Internet', icon: Mail },
  { key: 'vietnamese', label: 'Vietnamese', icon: MapPin },
];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Lisa', 'Daniel', 'Nancy',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
];

const VN_FIRST_NAMES = [
  'An', 'Bình', 'Chi', 'Dũng', 'Đức', 'Giang', 'Hà', 'Hải', 'Hòa', 'Hùng',
  'Hướng', 'Khoa', 'Lan', 'Linh', 'Loan', 'Long', 'Minh', 'My', 'Nhung', 'Phúc',
  'Phương', 'Quân', 'Quỳnh', 'Sơn', 'Thảo', 'Thu', 'Thuận', 'Tiến', 'Trang', 'Tùng',
  'Tâm', 'Uyên', 'Việt', 'Vân', 'Xuân', 'Yên', 'Hạnh', 'Hiền', 'Hường', 'Khanh',
];

const VN_LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Mai', 'Đoàn', 'Trương', 'Lương',
  'Cao', 'Đinh', 'Lưu', 'Mạc', 'Quách', 'Tạ', 'Tô', 'Tăng', 'Trịnh', 'Tôn',
];

const COMPANY_NAMES = [
  'TechVision Corp', 'Global Solutions Inc', 'Pinnacle Systems', 'Nexus Technologies',
  'Quantum Enterprises', 'Atlas Digital', 'Vertex Innovations', 'Horizon Media',
  'Catalyst Group', 'Meridian Labs', 'Apex Industries', 'Vanguard Software',
  'Stellar Analytics', 'Cipher Security', 'Nova Dynamics', 'Zenith Corp',
  'Empire Tech', 'Titan Solutions', 'Prime Logic', 'Alpha Works',
];

const JOB_TITLES = [
  'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
  'DevOps Engineer', 'Marketing Director', 'Financial Analyst', 'HR Manager',
  'Sales Executive', 'Project Manager', 'Business Analyst', 'IT Consultant',
  'Frontend Developer', 'Backend Developer', 'Full Stack Engineer', 'System Admin',
  'Content Strategist', 'Operations Manager', 'Research Scientist', 'QA Engineer',
];

const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Finance', 'Human Resources', 'Sales',
  'Operations', 'Research & Development', 'Customer Support', 'Legal', 'Design',
  'Product', 'IT', 'Quality Assurance', 'Data Analytics', 'Business Development',
];

const VN_CITIES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Biên Hòa', 'Nha Trang', 'Huế', 'Vũng Tàu', 'Quảng Ninh',
  'Đắk Lắk', 'Thanh Hóa', 'Đồng Nai', 'Bắc Ninh', 'Hải Dương',
];

const VN_STREETS = [
  'Trần Phú', 'Lê Lợi', 'Nguyễn Huệ', 'Lý Thường Kiệt', 'Hai Bà Trưng',
  'Điện Biên Phủ', 'Le Duan', 'Vo Van Tan', 'Pasteur', 'Nguyen Trai',
  'Cach Mang Thang 8', 'Xo Viet Nghe Tinh', 'Dien Bien Phu', 'Phan Dinh Phung', 'Bach Mai',
];

const DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com'];
const URL_PROTOCOLS = ['https://'];
const URL_DOMAINS = [
  'example.com', 'sample.org', 'demo.net', 'test.io', 'mock.dev',
  'fakestore.com', 'demoworld.org', 'sampledata.net', 'exampletest.com', 'fakedata.io',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function generateBirthday(): string {
  const year = randInt(1960, 2005);
  const month = padZero(randInt(1, 12));
  const maxDay = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][parseInt(month) - 1];
  const day = padZero(randInt(1, maxDay));
  return `${year}-${month}-${day}`;
}

function generateCreditCard(): string {
  const prefix = pick(['4', '5', '3']);
  let number = prefix;
  for (let i = 1; i < 16; i++) {
    number += randInt(0, 9).toString();
  }
  return number.replace(/(.{4})/g, '$1 ').trim();
}

function generateIBAN(): string {
  const country = pick(['DE', 'GB', 'FR', 'NL', 'ES', 'IT']);
  let iban = country;
  iban += randInt(10, 99).toString();
  for (let i = 0; i < 20; i++) {
    iban += randInt(0, 9).toString();
  }
  return iban;
}

function generateUsername(): string {
  const adjectives = ['cool', 'fast', 'bright', 'swift', 'dark', 'silent', 'wild', 'bold'];
  const nouns = ['tiger', 'eagle', 'wolf', 'fox', 'bear', 'hawk', 'lynx', 'dragon'];
  return `${pick(adjectives)}${pick(nouns)}${randInt(1, 999)}`;
}

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function generateURL(): string {
  return `${pick(URL_PROTOCOLS)}${pick(URL_DOMAINS)}/${generateUsername()}`;
}

function generateIPAddress(): string {
  return `${randInt(1, 255)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
}

function generateVietnameseName(): string {
  return `${pick(VN_LAST_NAMES)} ${pick(VN_FIRST_NAMES)}`;
}

function generateVietnamesePhone(): string {
  const prefixes = ['090', '091', '093', '094', '096', '097', '098', '099', '086', '088', '089'];
  return `${pick(prefixes)}${randInt(1000000, 9999999)}`;
}

function generateVietnameseAddress(): string {
  return `${randInt(1, 200)} ${pick(VN_STREETS)}, ${pick(VN_CITIES)}`;
}

function generateItem(category: Category) {
  switch (category) {
    case 'personal':
      return {
        fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
        email: `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}${randInt(1, 99)}@${pick(DOMAINS)}`,
        phone: `+1 (${randInt(200, 999)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`,
        address: `${randInt(100, 9999)} ${pick(['Main St', 'Oak Ave', 'Pine Rd', 'Elm Blvd', 'Maple Dr', 'Cedar Ln', 'First Ave', 'Second St'])}, ${pick(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'San Antonio', 'San Diego', 'Dallas', 'Austin', 'Seattle'])}`,
        birthday: generateBirthday(),
      };
    case 'business':
      return {
        company: pick(COMPANY_NAMES),
        jobTitle: pick(JOB_TITLES),
        department: pick(DEPARTMENTS),
      };
    case 'financial':
      return {
        creditCard: generateCreditCard(),
        iban: generateIBAN(),
      };
    case 'internet':
      return {
        username: generateUsername(),
        password: generatePassword(),
        url: generateURL(),
        ipAddress: generateIPAddress(),
      };
    case 'vietnamese':
      return {
        fullName: generateVietnameseName(),
        phone: generateVietnamesePhone(),
        address: generateVietnameseAddress(),
        email: `user${randInt(100, 999)}@${pick(DOMAINS)}`,
        birthday: generateBirthday(),
      };
  }
}

function generateData(category: Category, count: number) {
  const items: Record<string, string>[] = [];
  for (let i = 0; i < count; i++) {
    const raw = generateItem(category);
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== undefined && v !== null) clean[k] = String(v);
    }
    items.push(clean);
  }
  return items;
}

function toCSV(data: Record<string, string>[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FakeDataPage() {
  const [category, setCategory] = useState<Category>('personal');
  const [count, setCount] = useState(10);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  const handleGenerate = () => {
    const generated = generateData(category, count);
    setData(generated);
    setCopied(false);
  };

  const handleCopy = async () => {
    const text = viewMode === 'json' ? JSON.stringify(data, null, 2) : toCSV(data);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    downloadFile(toCSV(data), 'fake-data.csv', 'text/csv');
  };

  const handleDownloadJSON = () => {
    downloadFile(JSON.stringify(data, null, 2), 'fake-data.json', 'application/json');
  };

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="container">
      <Breadcrumbs />

      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Database size={28} style={{ color: 'hsl(var(--color-primary))' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
            Fake Data Generator
          </h1>
        </div>
        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
          Tạo dữ liệu giả lập nhanh chóng — chạy hoàn toàn trên trình duyệt của bạn.
        </p>
      </div>

      {/* Controls */}
      <div
        className="glass-panel"
        style={{ padding: '24px', marginBottom: '24px' }}
      >
        {/* Category Tabs */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'hsl(var(--text-secondary))',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Category
          </label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1.5px solid ${active ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                    background: active ? 'hsla(var(--color-primary) / 0.08)' : 'hsl(var(--bg-card))',
                    color: active ? 'hsl(var(--color-primary))' : 'hsl(var(--text-secondary))',
                    fontWeight: active ? 600 : 500,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count + Actions Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: '16px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'hsl(var(--text-secondary))',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Count
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1 && v <= 100) setCount(v);
              }}
              style={{
                width: '80px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid hsl(var(--border-glass))',
                background: 'hsl(var(--bg-card))',
                color: 'hsl(var(--text-primary))',
                fontSize: '1rem',
                fontWeight: 600,
                textAlign: 'center',
              }}
            />
          </div>

          <button
            className="neon-btn"
            onClick={handleGenerate}
            style={{ height: '42px' }}
          >
            <RefreshCw size={16} />
            Generate
          </button>

          {data.length > 0 && (
            <>
              <button
                className="neon-btn-secondary"
                onClick={handleCopy}
                style={{ height: '42px' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy All'}
              </button>

              <button
                className="neon-btn-secondary"
                onClick={handleDownloadCSV}
                style={{ height: '42px' }}
              >
                <Download size={16} />
                CSV
              </button>

              <button
                className="neon-btn-secondary"
                onClick={handleDownloadJSON}
                style={{ height: '42px' }}
              >
                <Download size={16} />
                JSON
              </button>
            </>
          )}
        </div>

        {/* View Mode Toggle */}
        {data.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: `1.5px solid ${viewMode === 'table' ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                background: viewMode === 'table' ? 'hsla(var(--color-primary) / 0.08)' : 'transparent',
                color: viewMode === 'table' ? 'hsl(var(--color-primary))' : 'hsl(var(--text-muted))',
                fontWeight: viewMode === 'table' ? 600 : 500,
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('json')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: `1.5px solid ${viewMode === 'json' ? 'hsl(var(--color-primary))' : 'hsl(var(--border-glass))'}`,
                background: viewMode === 'json' ? 'hsla(var(--color-primary) / 0.08)' : 'transparent',
                color: viewMode === 'json' ? 'hsl(var(--color-primary))' : 'hsl(var(--text-muted))',
                fontWeight: viewMode === 'json' ? 600 : 500,
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
              }}
            >
              JSON
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {data.length > 0 && viewMode === 'table' && (
        <div
          className="glass-panel"
          style={{
            padding: '0',
            overflow: 'hidden',
            marginBottom: '32px',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.9rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'hsl(var(--bg-subtle))',
                    borderBottom: '2px solid hsl(var(--border-glass))',
                  }}
                >
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: 'hsl(var(--text-secondary))',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    #
                  </th>
                  {headers.map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'hsl(var(--text-secondary))',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid hsl(var(--border-light))',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'hsl(var(--bg-subtle))')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td
                      style={{
                        padding: '10px 16px',
                        color: 'hsl(var(--text-muted))',
                        fontWeight: 500,
                      }}
                    >
                      {i + 1}
                    </td>
                    {headers.map((h) => (
                      <td
                        key={h}
                        style={{
                          padding: '10px 16px',
                          color: 'hsl(var(--text-primary))',
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {String(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length > 0 && viewMode === 'json' && (
        <div
          className="glass-panel"
          style={{
            padding: '0',
            overflow: 'hidden',
            marginBottom: '32px',
          }}
        >
          <pre
            style={{
              padding: '20px',
              margin: 0,
              fontSize: '0.85rem',
              fontFamily: "'Courier New', Consolas, monospace",
              lineHeight: 1.6,
              overflowX: 'auto',
              color: 'hsl(var(--text-primary))',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {data.length === 0 && (
        <div
          className="glass-panel"
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            marginBottom: '32px',
          }}
        >
          <Database
            size={48}
            style={{
              color: 'hsl(var(--border-light))',
              marginBottom: '16px',
            }}
          />
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
            Chọn danh sách và nhấn <strong>Generate</strong> để tạo dữ liệu giả.
          </p>
        </div>
      )}
    </div>
  );
}
