'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ProtectionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    const style = document.createElement('style');
    style.id = 'anti-copy-style';
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
      img {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: none !important;
      }
      input, textarea, [contenteditable] {
        -webkit-user-select: auto !important;
        user-select: auto !important;
      }
    `;
    document.head.appendChild(style);

    const blockEvent = (e: Event) => { e.preventDefault(); e.stopPropagation(); return false; };

    const events = ['contextmenu', 'copy', 'cut', 'paste', 'selectstart', 'dragstart'];
    events.forEach(ev => document.addEventListener(ev, blockEvent, true));

    const blockKeys = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        e.key === 'PrintScreen' || e.key === 'PrtScn' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', blockKeys, true);

    const devtoolsDetect = setInterval(() => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        document.body.innerHTML = '<h1 style="text-align:center;margin-top:20vh">Vui lòng tắt DevTools</h1>';
        clearInterval(devtoolsDetect);
      }
    }, 2000);

    if (window.top !== window.self && window.top) {
      window.top.location.href = window.self.location.href;
    }

    return () => {
      const s = document.getElementById('anti-copy-style');
      if (s) s.remove();
      events.forEach(ev => document.removeEventListener(ev, blockEvent, true));
      document.removeEventListener('keydown', blockKeys, true);
      clearInterval(devtoolsDetect);
    };
  }, [pathname]);

  return null;
}
