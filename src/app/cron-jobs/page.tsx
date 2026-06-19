'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Clock, Plus, Trash2, Power, PowerOff, Check, X, Loader2, Globe, Timer, Activity, Zap, ExternalLink, RotateCcw } from 'lucide-react';
import styles from './cron.module.css';
import { useAuth } from '@/components/AuthGuard';

interface CronJob {
  id: string;
  name: string;
  url: string;
  method: string;
  interval_minutes: number;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  status: string;
  total_runs: number;
  fail_count: number;
  created_at: string;
}

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [interval, setInterval_] = useState(30);
  const [showForm, setShowForm] = useState(false);

  const { user, requestAuth } = useAuth();

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cron-jobs');
      const json = await res.json();
      setJobs(json.data || []);
    } catch (err) {
      console.error('Fetch jobs error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      requestAuth();
      setIsCreating(false);
      return;
    }
    setErrorMsg(''); setSuccessMsg(''); setIsCreating(true);
    try {
      const res = await fetch('/api/cron-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, method, interval_minutes: interval }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccessMsg(`Tạo job "${json.data.name}" thành công!`);
      setName(''); setUrl(''); setMethod('GET'); setInterval_(30);
      setShowForm(false);
      fetchJobs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi tạo job.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (job: CronJob) => {
    try {
      await fetch('/api/cron-jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: job.id, is_active: !job.is_active, status: !job.is_active ? 'active' : 'paused' }),
      });
      fetchJobs();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = async (job: CronJob) => {
    if (!user) {
      requestAuth();
      return;
    }
    if (!confirm(`Xóa job "${job.name}"?`)) return;
    try {
      await fetch(`/api/cron-jobs?id=${job.id}`, { method: 'DELETE' });
      setSuccessMsg(`Đã xóa job "${job.name}".`);
      fetchJobs();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleExecuteNow = async () => {
    if (!user) {
      requestAuth();
      return;
    }
    setIsExecuting(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch('/api/cron-jobs/execute', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccessMsg(json.message || `Đã chạy ${json.executed} jobs.`);
      fetchJobs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi chạy cron.');
    } finally {
      setIsExecuting(false);
    }
  };

  const activeJobs = jobs.filter((j) => j.is_active).length;
  const totalRuns = jobs.reduce((sum, j) => sum + (j.total_runs || 0), 0);
  const failedJobs = jobs.filter((j) => (j.fail_count || 0) > 0).length;

  const formatInterval = (min: number) => {
    if (min < 60) return `${min} phút`;
    if (min < 1440) return `${Math.floor(min / 60)} giờ`;
    return `${Math.floor(min / 1440)} ngày`;
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const getStatusBadge = (job: CronJob) => {
    if (!job.is_active) return { text: 'Tạm dừng', color: 'rgba(107,114,128,0.15)', textColor: '#6b7280' };
    if (job.status === 'success') return { text: 'Thành công', color: 'rgba(16,185,129,0.15)', textColor: '#10b981' };
    if (job.status?.startsWith('error')) return { text: 'Lỗi', color: 'rgba(239,68,68,0.15)', textColor: '#ef4444' };
    return { text: 'Đang chạy', color: 'rgba(13,110,253,0.15)', textColor: 'hsl(var(--color-primary))' };
  };

  return (
    <div className="container">
      <Breadcrumbs />
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Cron<span>Jobs</span> Free</h1>
        <p className={styles.heroSubtitle}>
          Tạo và quản lý công việc định kỳ miễn phí. Tự động ping URL theo lịch trình, giữ cho dịch vụ của bạn luôn hoạt động.
        </p>
      </section>

      {errorMsg && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>{errorMsg}</div>
      )}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>{successMsg}</div>
      )}

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Zap size={20} style={{ color: 'hsl(var(--color-primary))' }} />
          <div>
            <div className={styles.statValue}>{activeJobs}</div>
            <div className={styles.statLabel}>Jobs đang chạy</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <Activity size={20} style={{ color: '#10b981' }} />
          <div>
            <div className={styles.statValue}>{totalRuns}</div>
            <div className={styles.statLabel}>Tổng lần chạy</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <Timer size={20} style={{ color: '#f59e0b' }} />
          <div>
            <div className={styles.statValue}>{jobs.length}</div>
            <div className={styles.statLabel}>Tổng jobs</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <RotateCcw size={20} style={{ color: failedJobs > 0 ? '#ef4444' : '#10b981' }} />
          <div>
            <div className={styles.statValue}>{failedJobs}</div>
            <div className={styles.statLabel}>Lỗi gần nhất</div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className={styles.actionsBar}>
        <button onClick={() => setShowForm(!showForm)} className="neon-btn">
          <Plus size={18} /> Tạo Job Mới
        </button>
        <button onClick={handleExecuteNow} disabled={isExecuting} className={styles.runNowBtn}>
          {isExecuting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
          {isExecuting ? 'Đang chạy...' : 'Chạy Ngay'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-panel" style={{ padding: '28px', marginBottom: '28px', border: '1px solid hsl(var(--color-primary))' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 700, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'hsl(var(--color-primary))' }} />
            Tạo CronJob Mới
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>URL cần Ping</label>
              <input type="url" required className={styles.formInput} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-service.com/health" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tên Job (tùy chọn)</label>
              <input type="text" className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tự lấy từ URL" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Phương thức</label>
              <select className={styles.formInput} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tần suất (phút, tối thiểu 5)</label>
              <select className={styles.formInput} value={interval} onChange={(e) => setInterval_(parseInt(e.target.value))}>
                <option value={5}>Mỗi 5 phút</option>
                <option value={10}>Mỗi 10 phút</option>
                <option value={15}>Mỗi 15 phút</option>
                <option value={30}>Mỗi 30 phút</option>
                <option value={60}>Mỗi 1 giờ</option>
                <option value={120}>Mỗi 2 giờ</option>
                <option value={360}>Mỗi 6 giờ</option>
                <option value={720}>Mỗi 12 giờ</option>
                <option value={1440}>Mỗi 24 giờ</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" className="neon-btn" disabled={isCreating}>
              {isCreating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
              {isCreating ? 'Đang tạo...' : 'Tạo Job'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="neon-btn-secondary">
              <X size={16} /> Hủy
            </button>
          </div>
        </form>
      )}

      {/* Jobs List */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'hsl(var(--color-primary))' }} />
          Danh Sách Jobs ({jobs.length})
        </h3>

        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'hsl(var(--text-secondary))' }}>Đang tải...</p>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', borderRadius: '16px', border: '1px dashed hsl(var(--border-glass))' }}>
            <Clock size={40} style={{ color: 'hsl(var(--text-muted))', marginBottom: '12px' }} />
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }}>Chưa có cron job nào. Tạo job đầu tiên!</p>
            <button onClick={() => setShowForm(true)} className="neon-btn"><Plus size={16} /> Tạo Job</button>
          </div>
        ) : (
          <div className={styles.jobsList}>
            {jobs.map((job) => {
              const badge = getStatusBadge(job);
              return (
                <div key={job.id} className={styles.jobCard} style={!job.is_active ? { opacity: 0.55 } : undefined}>
                  <div className={styles.jobHeader}>
                    <div className={styles.jobInfo}>
                      <div className={styles.jobName}>
                        <Globe size={16} style={{ color: 'hsl(var(--color-primary))', flexShrink: 0 }} />
                        {job.name}
                      </div>
                      <code className={styles.jobUrl}>{job.url}</code>
                    </div>
                    <span className={styles.statusBadge} style={{ background: badge.color, color: badge.textColor }}>
                      {badge.text}
                    </span>
                  </div>

                  <div className={styles.jobMeta}>
                    <span><Timer size={12} /> {formatInterval(job.interval_minutes)}</span>
                    <span><RotateCcw size={12} /> {job.total_runs} lần chạy</span>
                    <span>Lần chạy cuối: {formatTime(job.last_run)}</span>
                    <span>Kế tiếp: {formatTime(job.next_run)}</span>
                    {job.fail_count > 0 && <span style={{ color: '#ef4444' }}>Lỗi: {job.fail_count}</span>}
                  </div>

                  <div className={styles.jobActions}>
                    <button onClick={() => handleToggle(job)} className={styles.actionBtn} title={job.is_active ? 'Tạm dừng' : 'Bật'}>
                      {job.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                    </button>
                    <a href={job.url} target="_blank" rel="noopener" className={styles.actionBtn} title="Mở URL">
                      <ExternalLink size={16} />
                    </a>
                    <button onClick={() => handleDelete(job)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Xóa">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="glass-panel" style={{ padding: '28px', marginTop: '28px', marginBottom: '60px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '16px' }}>Cách sử dụng</h3>
        <div style={{ color: 'hsl(var(--text-secondary))', lineHeight: 1.8, fontSize: '0.92rem' }}>
          <p><strong>1.</strong> Nhấn <em>Tạo Job Mới</em> và nhập URL cần giữ alive.</p>
          <p><strong>2.</strong> Chọn tần suất: từ 5 phút đến 24 giờ.</p>
          <p><strong>3.</strong> Hệ thống sẽ tự động ping URL theo lịch trình đã chọn.</p>
          <p><strong>4.</strong> Nén <em>Chạy Ngay</em> để test tức thì tất cả jobs.</p>
          <p style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(13,110,253,0.06)', border: '1px solid rgba(13,110,253,0.12)' }}>
            <strong>Mẹo:</strong> Dùng cho UptimeRobot, Keep-Alive services, webhook testing, hoặc bất kỳ service nào cần ping định kỳ. Hỗ trợ GET, POST, HEAD.
          </p>
        </div>
      </div>
    </div>
  );
}
