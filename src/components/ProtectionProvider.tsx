'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ProtectionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    const toastStyle = document.createElement('style');
    toastStyle.id = 'anti-toast-style';
    toastStyle.textContent = `
      #anti-toast {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #dc2626;
        color: #fff;
        padding: 14px 32px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 1.1rem;
        z-index: 999999;
        box-shadow: 0 8px 30px rgba(220,38,38,0.4);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        font-family: inherit;
      }
      #anti-toast.show {
        opacity: 1;
      }
    `;
    document.head.appendChild(toastStyle);

    const toast = document.createElement('div');
    toast.id = 'anti-toast';
    document.body.appendChild(toast);

    let toastTimer: ReturnType<typeof setTimeout> | null = null;

    const showToast = (msg: string) => {
      toast.textContent = msg;
      toast.classList.add('show');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    };

    const blockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      showToast('XÂM PHẠM WEB LÀ CON CHÓ');
      return false;
    };

    const events = ['contextmenu', 'copy', 'cut', 'paste', 'selectstart', 'dragstart'];
    events.forEach(ev => document.addEventListener(ev, blockEvent, true));

    const blockKeys = (e: KeyboardEvent) => {
      const isBadKey =
        e.key === 'F12' ||
        e.key === 'PrintScreen' || e.key === 'PrtScn' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'));
      if (isBadKey) {
        e.preventDefault();
        showToast('XÂM PHẠM WEB LÀ CON CHÓ');
        return false;
      }
    };
    document.addEventListener('keydown', blockKeys, true);

    const devtoolsDetect = setInterval(() => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        clearInterval(devtoolsDetect);
        showToast('XÂM PHẠM WEB LÀ CON CHÓ');
        setTimeout(() => {
          document.body.innerHTML = '<h1 style="text-align:center;margin-top:20vh">XÂM PHẠM WEB LÀ CON CHÓ</h1>';
        }, 1000);
      }
    }, 2000);

    if (window.top !== window.self && window.top) {
      window.top.location.href = window.self.location.href;
    }

    return () => {
      const st = document.getElementById('anti-toast-style');
      if (st) st.remove();
      const el = document.getElementById('anti-toast');
      if (el) el.remove();
      if (toastTimer) clearTimeout(toastTimer);
      events.forEach(ev => document.removeEventListener(ev, blockEvent, true));
      document.removeEventListener('keydown', blockKeys, true);
      clearInterval(devtoolsDetect);
    };
  }, [pathname]);

  return null;
}
