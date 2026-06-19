'use client';

import { useState, useRef, useCallback } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/components/AuthGuard';
import { Image, Upload, Download, Trash2, Check, ArrowRight, Maximize, Minimize } from 'lucide-react';

interface CompressedImage {
  id: string;
  file: File;
  originalUrl: string;
  compressedUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  compressedWidth: number;
  compressedHeight: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function ImageCompressorPage() {
  const { user, requestAuth } = useAuth();
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const compressImage = useCallback(
    async (file: File): Promise<CompressedImage> => {
      return new Promise((resolve) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedUrl = URL.createObjectURL(blob);
                resolve({
                  id: crypto.randomUUID(),
                  file,
                  originalUrl: url,
                  compressedUrl,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  compressedWidth: img.naturalWidth,
                  compressedHeight: img.naturalHeight,
                });
              }
            },
            outputFormat,
            quality / 100
          );
        };

        img.src = url;
      });
    },
    [quality, outputFormat]
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (!user) {
        requestAuth();
        return;
      }
      const validFiles = Array.from(files).filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (validFiles.length === 0) return;

      setCompressing(true);
      const results = await Promise.all(validFiles.map(compressImage));
      setImages((prev) => [...prev, ...results]);
      setCompressing(false);
    },
    [compressImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.originalUrl);
        URL.revokeObjectURL(img.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      URL.revokeObjectURL(img.compressedUrl);
    });
    setImages([]);
  }, [images]);

  const downloadImage = useCallback((img: CompressedImage) => {
    const ext = outputFormat === 'image/jpeg' ? 'jpg' : outputFormat === 'image/png' ? 'png' : 'webp';
    const name = img.file.name.replace(/\.[^.]+$/, `.${ext}`);
    const a = document.createElement('a');
    a.href = img.compressedUrl;
    a.download = name;
    a.click();
  }, [outputFormat]);

  const downloadAll = useCallback(() => {
    images.forEach((img, i) => {
      setTimeout(() => downloadImage(img), i * 200);
    });
  }, [images, downloadImage]);

  const recompressAll = useCallback(async () => {
    setCompressing(true);
    const files = images.map((img) => img.file);
    images.forEach((img) => {
      URL.revokeObjectURL(img.originalUrl);
      URL.revokeObjectURL(img.compressedUrl);
    });
    setImages([]);

    const results = await Promise.all(files.map(compressImage));
    setImages(results);
    setCompressing(false);
  }, [images, compressImage]);

  const totalOriginal = images.reduce((s, i) => s + i.originalSize, 0);
  const totalCompressed = images.reduce((s, i) => s + i.compressedSize, 0);
  const totalRatio = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0;

  return (
    <div className="container">
      <Breadcrumbs />

      <style>{`
        .img-comp-page { max-width: 1100px; margin: 0 auto; padding: 24px 0 60px; }
        .img-comp-hero { text-align: center; margin-bottom: 32px; }
        .img-comp-hero h1 {
          font-size: 2rem; font-weight: 700; color: hsl(var(--text-primary)); margin-bottom: 8px;
        }
        .img-comp-hero h1 span { color: hsl(var(--color-primary)); }
        .img-comp-hero p {
          color: hsl(var(--text-muted)); font-size: 1.05rem; max-width: 560px; margin: 0 auto;
        }
        .img-comp-controls {
          display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap;
          background: hsl(var(--bg-card)); border: 1px solid hsl(var(--border-glass));
          border-radius: 12px; padding: 20px 24px; box-shadow: var(--shadow-card); margin-bottom: 24px;
        }
        .img-comp-control-group { display: flex; flex-direction: column; gap: 6px; }
        .img-comp-control-group label {
          font-size: 0.82rem; font-weight: 600; color: hsl(var(--text-secondary)); text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .img-comp-quality-row { display: flex; align-items: center; gap: 12px; }
        .img-comp-quality-row input[type="range"] {
          width: 180px; accent-color: hsl(var(--color-primary)); cursor: pointer;
        }
        .img-comp-quality-val {
          font-weight: 700; color: hsl(var(--color-primary)); font-size: 1rem; min-width: 36px;
        }
        .img-comp-select {
          padding: 9px 14px; border: 1.5px solid hsl(var(--border-glass)); border-radius: 8px;
          background: hsl(var(--bg-card)); color: hsl(var(--text-primary)); font-size: 0.95rem;
          cursor: pointer; outline: none; transition: border-color 0.2s;
        }
        .img-comp-select:focus { border-color: hsl(var(--color-primary)); }
        .img-comp-dropzone {
          border: 2px dashed hsl(var(--border-light)); border-radius: 12px; padding: 48px 24px;
          text-align: center; cursor: pointer; transition: all 0.25s; background: hsl(var(--bg-card));
        }
        .img-comp-dropzone.drag-over {
          border-color: hsl(var(--color-primary)); background: hsla(var(--color-primary) / 0.04);
        }
        .img-comp-dropzone-icon { color: hsl(var(--text-muted)); margin-bottom: 12px; }
        .img-comp-dropzone h3 {
          font-size: 1.1rem; font-weight: 600; color: hsl(var(--text-primary)); margin-bottom: 6px;
        }
        .img-comp-dropzone p { font-size: 0.9rem; color: hsl(var(--text-muted)); margin-bottom: 16px; }
        .img-comp-dropzone .neon-btn { pointer-events: none; }
        .img-comp-stats {
          display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
        }
        .img-comp-stat-card {
          flex: 1; min-width: 160px; background: hsl(var(--bg-card)); border: 1px solid hsl(var(--border-glass));
          border-radius: 12px; padding: 16px 20px; box-shadow: var(--shadow-card); text-align: center;
        }
        .img-comp-stat-label {
          font-size: 0.78rem; font-weight: 600; color: hsl(var(--text-muted)); text-transform: uppercase;
          letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .img-comp-stat-value { font-size: 1.25rem; font-weight: 700; color: hsl(var(--text-primary)); }
        .img-comp-stat-value.green { color: hsl(var(--color-success)); }
        .img-comp-actions {
          display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px;
        }
        .img-comp-grid {
          display: grid; grid-template-columns: 1fr; gap: 20px;
        }
        .img-comp-card {
          background: hsl(var(--bg-card)); border: 1px solid hsl(var(--border-glass));
          border-radius: 12px; box-shadow: var(--shadow-card); overflow: hidden;
        }
        .img-comp-card-header {
          display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;
          border-bottom: 1px solid hsl(var(--border-light));
        }
        .img-comp-card-name {
          font-weight: 600; font-size: 0.9rem; color: hsl(var(--text-primary));
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;
        }
        .img-comp-card-actions { display: flex; gap: 8px; }
        .img-comp-icon-btn {
          background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px;
          color: hsl(var(--text-muted)); transition: all 0.2s; display: flex; align-items: center;
          justify-content: center;
        }
        .img-comp-icon-btn:hover { background: hsl(var(--bg-subtle)); color: hsl(var(--text-primary)); }
        .img-comp-icon-btn.danger:hover { background: hsla(var(--color-danger) / 0.1); color: hsl(var(--color-danger)); }
        .img-comp-icon-btn.success:hover { background: hsla(var(--color-success) / 0.1); color: hsl(var(--color-success)); }
        .img-comp-card-previews {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: hsl(var(--border-light));
        }
        .img-comp-preview {
          background: hsl(var(--bg-card)); display: flex; flex-direction: column;
        }
        .img-comp-preview-label {
          font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
          padding: 8px 12px; color: hsl(var(--text-muted)); background: hsl(var(--bg-subtle));
          display: flex; align-items: center; gap: 6px;
        }
        .img-comp-preview-label .dot {
          width: 8px; height: 8px; border-radius: 50%;
        }
        .img-comp-preview-label .dot.orig { background: hsl(var(--color-warning)); }
        .img-comp-preview-label .dot.comp { background: hsl(var(--color-success)); }
        .img-comp-preview-img {
          width: 100%; aspect-ratio: 16/10; object-fit: contain; background: hsl(var(--bg-subtle));
          display: block;
        }
        .img-comp-card-info {
          display: flex; gap: 16px; padding: 12px 16px; flex-wrap: wrap; align-items: center;
          border-top: 1px solid hsl(var(--border-light));
        }
        .img-comp-info-item { font-size: 0.82rem; color: hsl(var(--text-secondary)); }
        .img-comp-info-item strong { color: hsl(var(--text-primary)); }
        .img-comp-badge {
          display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px;
          font-size: 0.78rem; font-weight: 600;
        }
        .img-comp-badge.save {
          background: hsla(var(--color-success) / 0.1); color: hsl(var(--color-success));
        }
        .img-comp-badge.increase {
          background: hsla(var(--color-danger) / 0.1); color: hsl(var(--color-danger));
        }
        .img-comp-empty {
          text-align: center; padding: 48px 24px; color: hsl(var(--text-muted));
        }
        .img-comp-progress {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          padding: 32px; color: hsl(var(--color-primary));
        }
        .img-comp-spinner {
          width: 24px; height: 24px; border: 3px solid hsl(var(--border-light));
          border-top-color: hsl(var(--color-primary)); border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @media (max-width: 640px) {
          .img-comp-controls { flex-direction: column; align-items: stretch; }
          .img-comp-quality-row input[type="range"] { width: 100%; }
          .img-comp-card-previews { grid-template-columns: 1fr; }
          .img-comp-card-name { max-width: 140px; }
          .img-comp-stats { flex-direction: column; }
        }
      `}</style>

      <div className="img-comp-page">
        <div className="img-comp-hero">
          <h1>
            Image <span>Compressor</span>
          </h1>
          <p>Nén hình ảnh ngay trên trình duyệt, giảm dung lượng mà không cần upload lên server.</p>
        </div>

        <div className="img-comp-controls">
          <div className="img-comp-control-group">
            <label>Chất lượng</label>
            <div className="img-comp-quality-row">
              <Minimize size={16} style={{ color: 'hsl(var(--text-muted))' }} />
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
              />
              <Maximize size={16} style={{ color: 'hsl(var(--text-muted))' }} />
              <span className="img-comp-quality-val">{quality}%</span>
            </div>
          </div>
          <div className="img-comp-control-group">
            <label>Định dạng xuất</label>
            <select
              className="img-comp-select"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as typeof outputFormat)}
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
        </div>

        <div
          className={`img-comp-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="img-comp-dropzone-icon">
            <Upload size={48} />
          </div>
          <h3>Kéo thả hình ảnh vào đây</h3>
          <p>Hỗ trợ JPG, PNG, WebP, GIF</p>
          <button className="neon-btn" type="button">
            <Image size={18} />
            Chọn hình ảnh
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {compressing && (
          <div className="img-comp-progress">
            <div className="img-comp-spinner" />
            <span>Đang nén hình ảnh...</span>
          </div>
        )}

        {images.length > 0 && !compressing && (
          <>
            <div className="img-comp-stats">
              <div className="img-comp-stat-card">
                <div className="img-comp-stat-label">Số ảnh</div>
                <div className="img-comp-stat-value">{images.length}</div>
              </div>
              <div className="img-comp-stat-card">
                <div className="img-comp-stat-label">Kích thước gốc</div>
                <div className="img-comp-stat-value">{formatSize(totalOriginal)}</div>
              </div>
              <div className="img-comp-stat-card">
                <div className="img-comp-stat-label">Kích thước nén</div>
                <div className="img-comp-stat-value">{formatSize(totalCompressed)}</div>
              </div>
              <div className="img-comp-stat-card">
                <div className="img-comp-stat-label">Tiết kiệm</div>
                <div className="img-comp-stat-value green">{totalRatio}%</div>
              </div>
            </div>

            <div className="img-comp-actions">
              <button className="neon-btn" onClick={recompressAll}>
                <ArrowRight size={18} />
                Nén lại với thiết lập mới
              </button>
              <button className="neon-btn" onClick={downloadAll}>
                <Download size={18} />
                Tải tất cả
              </button>
              <button className="neon-btn-secondary" onClick={clearAll}>
                <Trash2 size={18} />
                Xóa tất cả
              </button>
            </div>

            <div className="img-comp-grid">
              {images.map((img) => {
                const ratio = Math.round((1 - img.compressedSize / img.originalSize) * 100);
                const isSmaller = img.compressedSize < img.originalSize;

                return (
                  <div key={img.id} className="img-comp-card">
                    <div className="img-comp-card-header">
                      <span className="img-comp-card-name" title={img.file.name}>
                        {img.file.name}
                      </span>
                      <div className="img-comp-card-actions">
                        <button
                          className="img-comp-icon-btn success"
                          title="Tải ảnh nén"
                          onClick={() => downloadImage(img)}
                        >
                          <Download size={18} />
                        </button>
                        <button
                          className="img-comp-icon-btn danger"
                          title="Xóa"
                          onClick={() => removeImage(img.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="img-comp-card-previews">
                      <div className="img-comp-preview">
                        <div className="img-comp-preview-label">
                          <span className="dot orig" />
                          Gốc · {formatSize(img.originalSize)}
                        </div>
                        <img
                          className="img-comp-preview-img"
                          src={img.originalUrl}
                          alt="Original"
                        />
                      </div>
                      <div className="img-comp-preview">
                        <div className="img-comp-preview-label">
                          <span className="dot comp" />
                          Nén · {formatSize(img.compressedSize)}
                        </div>
                        <img
                          className="img-comp-preview-img"
                          src={img.compressedUrl}
                          alt="Compressed"
                        />
                      </div>
                    </div>
                    <div className="img-comp-card-info">
                      <div className="img-comp-info-item">
                        <strong>{img.width}×{img.height}</strong>px
                      </div>
                      <div className="img-comp-info-item">→</div>
                      <div className="img-comp-info-item">
                        <strong>{img.compressedWidth}×{img.compressedHeight}</strong>px
                      </div>
                      <span className={`img-comp-badge ${isSmaller ? 'save' : 'increase'}`}>
                        <Check size={14} />
                        {isSmaller ? `-${Math.abs(ratio)}%` : `+${ratio}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {images.length === 0 && !compressing && (
          <div className="img-comp-empty" style={{ marginTop: 32 }}>
            <Image size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Chưa có hình ảnh nào. Hãy chọn hoặc kéo thả ảnh vào khu vực bên trên.</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
