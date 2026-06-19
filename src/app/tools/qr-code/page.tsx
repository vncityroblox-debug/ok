'use client';

import { useState, useCallback } from 'react';
import { QrCode, Download, Copy, Check, Link, Mail, Phone, Wifi } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import PasteButton from '@/components/PasteButton';
import { useAuth } from '@/components/AuthGuard';

type TabId = 'url' | 'text' | 'email' | 'phone' | 'wifi';
type SizeOption = '200x200' | '300x300' | '500x500' | '800x800';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'url', label: 'URL', icon: <Link size={16} /> },
  { id: 'text', label: 'Text', icon: <QrCode size={16} /> },
  { id: 'email', label: 'Email', icon: <Mail size={16} /> },
  { id: 'phone', label: 'Phone', icon: <Phone size={16} /> },
  { id: 'wifi', label: 'WiFi', icon: <Wifi size={16} /> },
];

const sizeOptions: SizeOption[] = ['200x200', '300x300', '500x500', '800x800'];

function buildQrData(tab: TabId, inputs: Record<string, string>): string {
  switch (tab) {
    case 'url': return inputs.url;
    case 'text': return inputs.text;
    case 'email': return `mailto:${inputs.email}?subject=${encodeURIComponent(inputs.subject)}&body=${encodeURIComponent(inputs.body)}`;
    case 'phone': return `tel:${inputs.phone}`;
    case 'wifi': return `WIFI:T:${inputs.encryption};S:${inputs.ssid};P:${inputs.password};;`;
    default: return '';
  }
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'hsl(var(--text-secondary))',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid hsl(var(--border-glass))',
  background: 'hsl(var(--bg-card))',
  borderRadius: 8,
  outline: 'none',
  fontSize: '0.95rem',
  color: 'hsl(var(--text-primary))',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

export default function QRCodePage() {
  const { user, requestAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('url');
  const [inputs, setInputs] = useState<Record<string, string>>({
    url: '', text: '', email: '', subject: '', body: '', phone: '', ssid: '', password: '', encryption: 'WPA',
  });
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState<SizeOption>('300x300');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const qrValue = buildQrData(activeTab, inputs);
  const encodedData = encodeURIComponent(qrValue);
  const [w, h] = size.split('x');
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodedData}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`;
  const canGenerate = qrValue.trim().length > 0;

  const handleCopyLink = useCallback(async () => {
    if (!user) {
      requestAuth();
      return;
    }
    try {
      await navigator.clipboard.writeText(apiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { window.prompt('Copy this link:', apiUrl); }
  }, [apiUrl]);

  const handleDownload = useCallback(async () => {
    if (!user) {
      requestAuth();
      return;
    }
    if (!canGenerate) return;
    setDownloading(true);
    try {
      const res = await fetch(apiUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `qr-code-${activeTab}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { window.open(apiUrl, '_blank'); }
    finally { setDownloading(false); }
  }, [apiUrl, canGenerate, activeTab]);

  const updateInput = (key: string, value: string) => setInputs((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="container">
      <Breadcrumbs />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0 60px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'hsl(var(--color-primary) / 0.1)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <QrCode size={28} style={{ color: 'hsl(var(--color-primary))' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: 8 }}>
            QR Code Generator
          </h1>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.95rem' }}>
            Tạo mã QR cho URL, văn bản, email, số điện thoại hoặc WiFi
          </p>
        </div>

        {/* Main grid: stacks on mobile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Left: Config */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-glass))',
            borderRadius: 12,
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden',
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border-light))', overflowX: 'auto' }}>
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, minWidth: 0, padding: '12px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: activeTab === tab.id ? 'hsl(var(--color-primary) / 0.08)' : 'transparent',
                  color: activeTab === tab.id ? 'hsl(var(--color-primary))' : 'hsl(var(--text-muted))',
                  borderBottom: activeTab === tab.id ? '2px solid hsl(var(--color-primary))' : '2px solid transparent',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div style={{ padding: 20 }}>
              {activeTab === 'url' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={labelStyle}>URL</label>
                    <PasteButton onPaste={(text) => updateInput('url', text.trim())} style={{ width: 28, height: 28 }} />
                  </div>
                  <input type="url" placeholder="https://example.com" value={inputs.url} onChange={(e) => updateInput('url', e.target.value)} style={inputStyle} />
                </div>
              )}
              {activeTab === 'text' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={labelStyle}>Text</label>
                    <PasteButton onPaste={(text) => updateInput('text', text)} style={{ width: 28, height: 28 }} />
                  </div>
                  <textarea placeholder="Nhập nội dung văn bản..." value={inputs.text} onChange={(e) => updateInput('text', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              )}
              {activeTab === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label style={labelStyle}>Email</label><input type="email" placeholder="example@email.com" value={inputs.email} onChange={(e) => updateInput('email', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Subject</label><input type="text" placeholder="Tiêu đề email" value={inputs.subject} onChange={(e) => updateInput('subject', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Body</label><textarea placeholder="Nội dung email..." value={inputs.body} onChange={(e) => updateInput('body', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
                </div>
              )}
              {activeTab === 'phone' && (
                <div><label style={labelStyle}>Phone Number</label><input type="tel" placeholder="+84 123 456 789" value={inputs.phone} onChange={(e) => updateInput('phone', e.target.value)} style={inputStyle} /></div>
              )}
              {activeTab === 'wifi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label style={labelStyle}>SSID</label><input type="text" placeholder="Tên mạng WiFi" value={inputs.ssid} onChange={(e) => updateInput('ssid', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Password</label><input type="text" placeholder="Mật khẩu WiFi" value={inputs.password} onChange={(e) => updateInput('password', e.target.value)} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Encryption</label><select value={inputs.encryption} onChange={(e) => updateInput('encryption', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">None (Open)</option></select></div>
                </div>
              )}
            </div>

            {/* Colors & Size */}
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ borderTop: '1px solid hsl(var(--border-light))', paddingTop: 16 }}>
                <label style={labelStyle}>Colors</label>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} style={{ width: 36, height: 36, border: '2px solid hsl(var(--border-light))', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>Foreground</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: 36, height: 36, border: '2px solid hsl(var(--border-light))', borderRadius: 8, cursor: 'pointer', padding: 2 }} />
                    <span style={{ fontSize: '0.82rem', color: 'hsl(var(--text-muted))' }}>Background</span>
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Size</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {sizeOptions.map((s) => (
                    <button key={s} onClick={() => setSize(s)} style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: `1.5px solid ${size === s ? 'hsl(var(--color-primary))' : 'hsl(var(--border-light))'}`,
                      background: size === s ? 'hsl(var(--color-primary) / 0.08)' : 'hsl(var(--bg-card))',
                      color: size === s ? 'hsl(var(--color-primary))' : 'hsl(var(--text-secondary))',
                      fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-glass))',
            borderRadius: 12,
            boxShadow: 'var(--shadow-card)',
            padding: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--text-primary))', alignSelf: 'flex-start' }}>
              Preview
            </h3>

            <div style={{
              width: '100%', maxWidth: 300, aspectRatio: '1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 12, background: 'hsl(var(--bg-subtle))',
              border: '1px dashed hsl(var(--border-light))', overflow: 'hidden',
            }}>
              {canGenerate ? (
                <img src={apiUrl} alt="QR Code" style={{
                  width: '100%', height: '100%', objectFit: 'contain', padding: 8,
                }} />
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                  <QrCode size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>Nhập dữ liệu để tạo mã QR</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button onClick={handleDownload} disabled={!canGenerate || downloading} style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none',
                background: canGenerate ? 'hsl(var(--color-primary))' : 'hsl(var(--bg-subtle))',
                color: canGenerate ? '#fff' : 'hsl(var(--text-muted))',
                fontWeight: 600, fontSize: '0.9rem', cursor: canGenerate ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
              }}>
                <Download size={16} />{downloading ? 'Đang tải...' : 'Tải về'}
              </button>
              <button onClick={handleCopyLink} disabled={!canGenerate} style={{
                flex: 1, padding: '10px 16px', borderRadius: 8,
                border: `1.5px solid ${canGenerate ? 'hsl(var(--color-primary))' : 'hsl(var(--border-light))'}`,
                background: 'transparent',
                color: canGenerate ? 'hsl(var(--color-primary))' : 'hsl(var(--text-muted))',
                fontWeight: 600, fontSize: '0.9rem', cursor: canGenerate ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
              }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Đã copy' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
