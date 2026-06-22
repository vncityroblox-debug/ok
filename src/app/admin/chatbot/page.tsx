'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  MessageSquare, Save, RefreshCw, Plus, Trash2, X, CheckCircle, XCircle,
  ToggleLeft, ToggleRight, Send, Bot, Settings, HelpCircle,
} from 'lucide-react';
import styles from '../admin.module.css';

interface ChatbotConfig {
  bot_enabled: boolean;
  welcome_message: string;
  response_rules: { keyword: string; reply: string }[];
  zalo_token: string;
}

export default function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig>({
    bot_enabled: true,
    welcome_message: '',
    response_rules: [],
    zalo_token: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [newReply, setNewReply] = useState('');

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/chatbot', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.config) {
        setConfig({
          bot_enabled: json.config.bot_enabled ?? true,
          welcome_message: json.config.welcome_message ?? '',
          response_rules: json.config.response_rules ?? [],
          zalo_token: json.config.zalo_token ?? '',
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: json.error || 'Lỗi lưu cấu hình' });
      } else {
        setMsg({ type: 'success', text: 'Lưu cấu hình thành công!' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Không kết nối được server' });
    } finally {
      setSaving(false);
    }
  };

  const addRule = () => {
    if (!newKeyword.trim() || !newReply.trim()) return;
    setConfig(prev => ({
      ...prev,
      response_rules: [...prev.response_rules, { keyword: newKeyword.trim(), reply: newReply.trim() }],
    }));
    setNewKeyword('');
    setNewReply('');
  };

  const removeRule = (index: number) => {
    setConfig(prev => ({
      ...prev,
      response_rules: prev.response_rules.filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Chatbot Zalo</h1>
        <p className={styles.pageSubtitle}>Cấu hình bot tự động phản hồi trên Zalo</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'hsl(var(--text-muted))' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Đang tải cấu hình...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Toggle + Token */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <Settings size={18} style={{ color: 'hsl(var(--color-primary))' }} />
              Cấu Hình Chung
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bật Bot</div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Bot sẽ tự động phản hồi tin nhắn trên Zalo</div>
                </div>
                <button onClick={() => setConfig(prev => ({ ...prev, bot_enabled: !prev.bot_enabled }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: config.bot_enabled ? '#10b981' : 'hsl(var(--text-muted))' }}>
                  {config.bot_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Zalo Bot Token</label>
                <input className={styles.formInput} value={config.zalo_token} onChange={e => setConfig(prev => ({ ...prev, zalo_token: e.target.value }))} placeholder="Nhập token Zalo Bot..." type="password" />
                <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                  Token từ Zalo Bot Creator. Giữ bí mật!
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <Bot size={18} style={{ color: 'hsl(var(--color-primary))' }} />
              Tin Nhắn Chào Mừng
            </div>
            <textarea
              className={styles.formInput}
              value={config.welcome_message}
              onChange={e => setConfig(prev => ({ ...prev, welcome_message: e.target.value }))}
              placeholder="Nhập tin nhắn chào mừng..."
              rows={3}
              style={{ resize: 'vertical', minHeight: '80px' }}
            />
            <div style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Tin nhắn gửi khi người dùng nhắn tin lần đầu hoặc không khớp rule nào.
            </div>
          </div>

          {/* Response Rules */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <HelpCircle size={18} style={{ color: 'hsl(var(--color-primary))' }} />
              Rules Phản Hồi ({config.response_rules.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {config.response_rules.map((rule, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px',
                  borderRadius: '10px', background: 'hsl(var(--bg-subtle))', border: '1px solid hsl(var(--border-glass))',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--color-primary))', marginBottom: '2px' }}>
                      Khi tin nhắn chứa: "{rule.keyword}"
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'hsl(var(--text-secondary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Trả lời: {rule.reply}
                    </div>
                  </div>
                  <button onClick={() => removeRule(index)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--color-danger))', padding: '4px', borderRadius: '4px', flexShrink: 0 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {config.response_rules.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.85rem', background: 'hsl(var(--bg-subtle))', borderRadius: '10px', border: '1px solid hsl(var(--border-glass))', marginBottom: '16px' }}>
                Chưa có rule nào. Thêm rule bên dưới.
              </div>
            )}

            {/* Add new rule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', borderRadius: '10px', border: '2px dashed hsl(var(--border-glass))' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>Thêm Rule Mới</div>
              <input className={styles.formInput} value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="Từ khóa (ví dụ: xin chào)" />
              <textarea className={styles.formInput} value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Câu trả lời..." rows={2} style={{ resize: 'vertical' }} />
              <button onClick={addRule} disabled={!newKeyword.trim() || !newReply.trim()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '10px', border: 'none',
                  background: newKeyword.trim() && newReply.trim() ? 'hsl(var(--color-primary))' : 'hsl(var(--bg-subtle))',
                  color: newKeyword.trim() && newReply.trim() ? '#fff' : 'hsl(var(--text-muted))',
                  fontWeight: 600, fontSize: '0.85rem', cursor: newKeyword.trim() && newReply.trim() ? 'pointer' : 'not-allowed',
                }}>
                <Plus size={16} /> Thêm Rule
              </button>
            </div>
          </div>

          {/* Save */}
          {msg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '10px',
              background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: msg.type === 'success' ? '#10b981' : '#ef4444', fontSize: '0.9rem',
            }}>
              {msg.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {msg.text}
            </div>
          )}

          <button onClick={handleSave} disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '14px 28px', borderRadius: '12px', border: 'none',
              background: saving ? 'rgba(139,92,246,0.3)' : 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
              color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer',
            }}>
            {saving ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</> : <><Save size={18} /> Lưu Cấu Hình</>}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
