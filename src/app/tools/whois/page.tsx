'use client';

import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Globe, Search, Server, Clock, Shield, Copy, Check, ExternalLink } from 'lucide-react';

type WhoisData = {
  domainName?: string;
  registrar?: string;
  creationDate?: string;
  expiryDate?: string;
  nameServers?: string[];
  status?: string[];
  registrant?: string;
  updatedDate?: string;
};

type DnsRecord = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

type DnsResponse = {
  Status: number;
  Answer?: DnsRecord[];
};

const RECORD_TYPES: { label: string; type: number }[] = [
  { label: 'A', type: 1 },
  { label: 'AAAA', type: 28 },
  { label: 'MX', type: 15 },
  { label: 'NS', type: 2 },
  { label: 'TXT', type: 16 },
  { label: 'CNAME', type: 5 },
];

export default function WhoisPage() {
  const [domain, setDomain] = useState('');
  const [activeTab, setActiveTab] = useState<'whois' | 'dns'>('whois');
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null);
  const [dnsRecords, setDnsRecords] = useState<Record<number, DnsRecord[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanDomain = (input: string) => {
    let d = input.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, '');
    d = d.replace(/\/.*$/, '');
    d = d.replace(/^www\./, '');
    return d;
  };

  const fetchWhois = async (domainName: string) => {
    try {
      const res = await fetch(
        `https://api.whoisxmlapi.com/v1?apiKey=at_demo&domainName=${domainName}`
      );
      if (!res.ok) throw new Error('WHOIS request failed');
      const data = await res.json();

      const record = data.records?.[0] || {};
      const parsed: WhoisData = {
        domainName: record.domainName || domainName,
        registrar: record.registrarName || record.registrarWhoisServer || 'N/A',
        creationDate: record.createdDate || record.registryData?.createdDate || 'N/A',
        expiryDate: record.expiresDate || record.registryData?.expiresDate || 'N/A',
        updatedDate: record.updatedDate || record.registryData?.updatedDate || 'N/A',
        nameServers: record.nameServers
          ? (typeof record.nameServers === 'string'
              ? record.nameServers.split(',').map((s: string) => s.trim())
              : record.nameServers)
          : [],
        status: record.status
          ? (Array.isArray(record.status) ? record.status : [record.status])
          : [],
        registrant: record.registrant?.organization || record.registrant?.name || 'N/A',
      };

      setWhoisData(parsed);
    } catch {
      throw new Error('Không thể lấy thông tin WHOIS. Vui lòng thử lại.');
    }
  };

  const fetchDns = async (domainName: string) => {
    const results: Record<number, DnsRecord[]> = {};
    const promises = RECORD_TYPES.map(async ({ type }) => {
      try {
        const res = await fetch(
          `https://dns.google/resolve?name=${domainName}&type=${type}`
        );
        if (!res.ok) return;
        const data: DnsResponse = await res.json();
        if (data.Answer && data.Answer.length > 0) {
          results[type] = data.Answer.filter(
            (a) => RECORD_TYPES.some((r) => r.type === a.type)
          );
        }
      } catch {
        // silently skip failed record types
      }
    });

    await Promise.all(promises);
    setDnsRecords(results);
  };

  const handleLookup = async () => {
    const cleaned = cleanDomain(domain);
    if (!cleaned) {
      setError('Vui lòng nhập tên miền.');
      return;
    }

    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(cleaned)) {
      setError('Định dạng tên miền không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');
    setWhoisData(null);
    setDnsRecords({});

    try {
      await Promise.all([fetchWhois(cleaned), fetchDns(cleaned)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không mong muốn.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLookup();
  };

  const buildPlainText = () => {
    const lines: string[] = [];

    if (activeTab === 'whois' && whoisData) {
      lines.push(`WHOIS Information — ${whoisData.domainName}`);
      lines.push('─'.repeat(40));
      lines.push(`Registrar:        ${whoisData.registrar}`);
      lines.push(`Created:          ${whoisData.creationDate}`);
      lines.push(`Expires:          ${whoisData.expiryDate}`);
      lines.push(`Updated:          ${whoisData.updatedDate}`);
      lines.push(`Registrant:       ${whoisData.registrant}`);
      if (whoisData.nameServers?.length) {
        lines.push(`Name Servers:     ${whoisData.nameServers.join(', ')}`);
      }
      if (whoisData.status?.length) {
        lines.push(`Status:           ${whoisData.status.join(', ')}`);
      }
    }

    if (activeTab === 'dns' && Object.keys(dnsRecords).length) {
      lines.push(`DNS Records — ${domain}`);
      lines.push('─'.repeat(40));
      for (const [typeNum, records] of Object.entries(dnsRecords)) {
        const label = RECORD_TYPES.find((r) => r.type === Number(typeNum))?.label || typeNum;
        for (const rec of records) {
          lines.push(`${label.padEnd(6)} ${rec.TTL.toString().padEnd(8)} ${rec.data}`);
        }
      }
    }

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = buildPlainText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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

  const hasResults =
    (activeTab === 'whois' && whoisData) ||
    (activeTab === 'dns' && Object.keys(dnsRecords).length > 0);

  return (
    <div className="container">
      <Breadcrumbs />

      <section style={{ textAlign: 'center', padding: '60px 0 40px' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'hsl(var(--text-primary))',
            marginBottom: 12,
          }}
        >
          WHOIS & DNS <span style={{
            background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-success)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Lookup</span>
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.1rem', maxWidth: 520, margin: '0 auto' }}>
          Tra cứu thông tin WHOIS và bản ghi DNS của bất kỳ tên miền nào.
        </p>
      </section>

      <div style={{ maxWidth: 720, margin: '0 auto 48px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'hsl(var(--bg-card))',
            border: '2px solid hsl(var(--border-glass))',
            borderRadius: 14,
            padding: 6,
            boxShadow: 'var(--shadow-card)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--color-primary))';
            e.currentTarget.style.boxShadow = '0 0 0 4px hsla(var(--color-primary) / 0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--border-glass))';
            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 8px 0 14px' }}>
            <Globe size={20} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="nhập tên miền (ví dụ: google.com)"
              style={{
                flex: 1,
                padding: '14px 12px',
                fontSize: '1.05rem',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'hsl(var(--text-primary))',
              }}
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={loading}
            className="neon-btn"
            style={{ padding: '12px 24px', borderRadius: 10, whiteSpace: 'nowrap' }}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #fff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Đang tra cứu...
              </span>
            ) : (
              <>
                <Search size={18} />
                Tra cứu
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto 32px',
            padding: '16px 20px',
            background: 'hsla(var(--color-danger) / 0.08)',
            border: '1px solid hsla(var(--color-danger) / 0.25)',
            borderRadius: 12,
            color: 'hsl(var(--color-danger))',
            fontWeight: 500,
            fontSize: '0.95rem',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !whoisData && Object.keys(dnsRecords).length === 0 && (
        <div
          style={{
            maxWidth: 600,
            margin: '0 auto 60px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { icon: Globe, label: 'WHOIS Info', desc: 'Registrar, ngày tạo, hết hạn' },
            { icon: Server, label: 'DNS Records', desc: 'A, AAAA, MX, NS, TXT, CNAME' },
            { icon: Clock, label: 'TTL Values', desc: 'Thời gian hết hạn bản ghi' },
            { icon: Shield, label: 'Bảo mật', desc: 'Không lưu trữ dữ liệu' },
          ].map((item) => (
            <div
              key={item.label}
              className="glass-panel"
              style={{ padding: '24px 18px', textAlign: 'center' }}
            >
              <item.icon
                size={28}
                style={{ color: 'hsl(var(--color-primary))', marginBottom: 10 }}
              />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'hsl(var(--text-primary))', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      )}

      {(whoisData || Object.keys(dnsRecords).length > 0) && (
        <div style={{ maxWidth: 800, margin: '0 auto 80px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                background: 'hsl(var(--bg-card))',
                border: '1.5px solid hsl(var(--border-glass))',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {(['whois', 'dns'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 24px',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeTab === tab ? 'hsl(var(--color-primary))' : 'transparent',
                    color: activeTab === tab ? '#fff' : 'hsl(var(--text-secondary))',
                  }}
                >
                  {tab === 'whois' ? 'WHOIS' : 'DNS'}
                </button>
              ))}
            </div>

            {hasResults && (
              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1.5px solid hsl(var(--border-glass))',
                  background: 'hsl(var(--bg-card))',
                  color: copied ? 'hsl(var(--color-success))' : 'hsl(var(--text-secondary))',
                  fontWeight: 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Đã sao chép!' : 'Sao chép kết quả'}
              </button>
            )}
          </div>

          {activeTab === 'whois' && whoisData && (
            <div
              className="glass-panel"
              style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <Globe size={22} style={{ color: 'hsl(var(--color-primary))' }} />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                  Thông tin WHOIS
                </h2>
                <a
                  href={`https://www.google.com/search?q=whois+${whoisData.domainName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.85rem',
                    color: 'hsl(var(--color-primary))',
                  }}
                >
                  Chi tiết hơn <ExternalLink size={14} />
                </a>
              </div>

              <div style={{ display: 'grid', gap: 20 }}>
                {[
                  { label: 'Tên miền', value: whoisData.domainName, icon: Globe },
                  { label: 'Nhà đăng ký', value: whoisData.registrar, icon: Shield },
                  { label: 'Người sở hữu', value: whoisData.registrant, icon: Shield },
                  { label: 'Ngày tạo', value: whoisData.creationDate, icon: Clock },
                  { label: 'Ngày hết hạn', value: whoisData.expiryDate, icon: Clock },
                  { label: 'Cập nhật lần cuối', value: whoisData.updatedDate, icon: Clock },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      padding: '14px 0',
                      borderBottom: '1px solid hsl(var(--border-glass))',
                    }}
                  >
                    <item.icon
                      size={18}
                      style={{
                        color: 'hsl(var(--text-muted))',
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'hsl(var(--text-muted))',
                          marginBottom: 2,
                          fontWeight: 500,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.98rem',
                          color: 'hsl(var(--text-primary))',
                          fontWeight: 600,
                          wordBreak: 'break-all',
                        }}
                      >
                        {item.value || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}

                {whoisData.nameServers && whoisData.nameServers.length > 0 && (
                  <div style={{ paddingTop: 4 }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: 10,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Server size={14} />
                      Name Servers
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {whoisData.nameServers.map((ns) => (
                        <span
                          key={ns}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            background: 'hsl(var(--bg-subtle))',
                            border: '1px solid hsl(var(--border-light))',
                            fontSize: '0.88rem',
                            fontFamily: 'monospace',
                            color: 'hsl(var(--text-primary))',
                            fontWeight: 500,
                          }}
                        >
                          {ns}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {whoisData.status && whoisData.status.length > 0 && (
                  <div style={{ paddingTop: 4 }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: 10,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Shield size={14} />
                      Trạng thái
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {whoisData.status.map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            background: 'hsla(var(--color-success) / 0.08)',
                            border: '1px solid hsla(var(--color-success) / 0.2)',
                            fontSize: '0.85rem',
                            color: 'hsl(var(--color-success))',
                            fontWeight: 500,
                            fontFamily: 'monospace',
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dns' && Object.keys(dnsRecords).length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                animation: 'fadeIn 0.3s ease',
              }}
            >
              {RECORD_TYPES.filter((r) => dnsRecords[r.type]?.length).map(({ label, type }) => (
                <div
                  key={type}
                  className="glass-panel"
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '16px 24px',
                      borderBottom: '1px solid hsl(var(--border-glass))',
                      background: 'hsl(var(--bg-subtle))',
                    }}
                  >
                    <Server size={18} style={{ color: 'hsl(var(--color-primary))' }} />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--text-primary))' }}>
                      {label} Records
                    </span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        padding: '2px 10px',
                        borderRadius: 20,
                        background: 'hsla(var(--color-primary) / 0.1)',
                        color: 'hsl(var(--color-primary))',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                      }}
                    >
                      {dnsRecords[type].length}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.9rem',
                      }}
                    >
                      <thead>
                        <tr>
                          {['Name', 'TTL', 'Data'].map((h) => (
                            <th
                              key={h}
                              style={{
                                textAlign: 'left',
                                padding: '10px 20px',
                                color: 'hsl(var(--text-muted))',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                borderBottom: '1px solid hsl(var(--border-glass))',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dnsRecords[type].map((rec, i) => (
                          <tr
                            key={`${rec.data}-${i}`}
                            style={{
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
                                padding: '10px 20px',
                                borderBottom: '1px solid hsl(var(--border-glass))',
                                color: 'hsl(var(--text-secondary))',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all',
                              }}
                            >
                              {rec.name}
                            </td>
                            <td
                              style={{
                                padding: '10px 20px',
                                borderBottom: '1px solid hsl(var(--border-glass))',
                                color: 'hsl(var(--text-muted))',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {rec.TTL}s
                            </td>
                            <td
                              style={{
                                padding: '10px 20px',
                                borderBottom: '1px solid hsl(var(--border-glass))',
                                color: 'hsl(var(--text-primary))',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                wordBreak: 'break-all',
                              }}
                            >
                              {rec.data}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dns' && Object.keys(dnsRecords).length === 0 && !loading && whoisData && (
            <div
              className="glass-panel"
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'hsl(var(--text-muted))',
              }}
            >
              <Server size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>Không tìm thấy bản ghi DNS nào.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
