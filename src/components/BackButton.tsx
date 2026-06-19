'use client';

import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        border: 'none',
        color: 'hsl(var(--color-primary))',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem',
        padding: '8px 0',
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
    >
      <ArrowLeft size={16} />
      Quay Lại
    </button>
  );
}
