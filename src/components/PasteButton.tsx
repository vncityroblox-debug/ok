'use client';

import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';

interface PasteButtonProps {
  onPaste: (text: string) => void;
  style?: React.CSSProperties;
}

export default function PasteButton({ onPaste, style }: PasteButtonProps) {
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onPaste(text);
        setStatus('ok');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } catch {
      setStatus('fail');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePaste}
      title="Dán từ clipboard"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 8,
        border: '1.5px solid hsl(var(--border-glass))',
        background: status === 'ok'
          ? 'hsla(var(--color-success) / 0.1)'
          : status === 'fail'
          ? 'hsla(var(--color-danger) / 0.1)'
          : 'hsl(var(--bg-card))',
        color: status === 'ok'
          ? 'hsl(var(--color-success))'
          : status === 'fail'
          ? 'hsl(var(--color-danger))'
          : 'hsl(var(--text-muted))',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (status === 'idle') {
          e.currentTarget.style.borderColor = 'hsl(var(--color-primary))';
          e.currentTarget.style.color = 'hsl(var(--color-primary))';
        }
      }}
      onMouseLeave={(e) => {
        if (status === 'idle') {
          e.currentTarget.style.borderColor = 'hsl(var(--border-glass))';
          e.currentTarget.style.color = 'hsl(var(--text-muted))';
        }
      }}
    >
      <ClipboardPaste size={16} />
    </button>
  );
}
