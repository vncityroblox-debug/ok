'use client';

import { CheckCircle } from 'lucide-react';

type BadgeSize = 'sm' | 'md' | 'lg';

export default function VerifiedBadge({ size = 'sm' }: { size?: BadgeSize }) {
  const sizeMap = {
    sm: { icon: 12, padding: '1px 6px', fontSize: '0.65rem', gap: 3 },
    md: { icon: 14, padding: '2px 8px', fontSize: '0.72rem', gap: 4 },
    lg: { icon: 18, padding: '4px 12px', fontSize: '0.82rem', gap: 6 },
  };

  const s = sizeMap[size];

  return (
    <span className="verifiedBadge" style={{ padding: s.padding, fontSize: s.fontSize, gap: s.gap }}>
      <CheckCircle size={s.icon} strokeWidth={2.5} />
      {size === 'lg' && 'Đã Xác Thực'}
    </span>
  );
}
