'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DAO_LY = [
  'ĐẠO LÝ LÀM NGƯỜI',
  '',
  '1. Tôn trọng là nền tảng của mọi mối quan hệ.',
  '   Web này là tài sản của người khác, xâm phạm là vi phạm đạo đức.',
  '',
  '2. Nhân quả không sai một ai.',
  '   Gieo nhân nào gặt quả nấy. Làm điều xấu sẽ nhận điều xấu.',
  '',
  '3. Người khôn không sợ, chỉ có kẻ tiểu nhân mới lén lút.',
  '   Hãy sống đường hoàng, chính trực, không cần gian dối.',
  '',
  '4. Hãy dùng thời gian và kiến thức vào việc tốt,',
  '   đừng phí hoài cuộc đời vào những trò xâm phạm vô bổ.',
  '',
  '5. Một người tử tế không cần phá hoại người khác để khẳng định mình.',
  '',
  '═══ HÌNH PHẠT NHÂN QUẢ ═══',
  'Kẻ nào cố tình xâm phạm sẽ tự chuốc lấy hậu quả.',
  'Không ai có thể trốn tránh luật nhân quả.',
];

export default function ProtectionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;

    const moralOverlayStyle = document.createElement('style');
    moralOverlayStyle.id = 'anti-moral-style';
    moralOverlayStyle.textContent = `
        position: fixed;
        inset: 0;
        background: linear-gradient(135deg, #0f0f1a, #1a0a0a);
        color: #f0e6d0;
        z-index: 9999998;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        font-family: 'Georgia', serif;
        overflow-y: auto;
        animation: antiFadeIn 0.6s ease;
      }
      @keyframes antiFadeIn {
        from { opacity: 0; transform: scale(1.05); }
        to { opacity: 1; transform: scale(1); }
      }
      #anti-moral-overlay h1 {
        font-size: 2.5rem;
        color: #dc2626;
        margin-bottom: 10px;
        text-shadow: 0 0 30px rgba(220,38,38,0.3);
        letter-spacing: 4px;
      }
      #anti-moral-overlay .sub {
        color: #b8860b;
        font-size: 1.1rem;
        font-style: italic;
        margin-bottom: 30px;
      }
      #anti-moral-overlay .content {
        max-width: 700px;
        font-size: 1.05rem;
        line-height: 1.9;
        white-space: pre-wrap;
        background: rgba(0,0,0,0.4);
        padding: 30px;
        border-radius: 16px;
        border: 1px solid rgba(220,38,38,0.2);
      }
      #anti-moral-overlay .footer {
        margin-top: 30px;
        color: #666;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(moralOverlayStyle);

    const showMoralLesson = () => {
      const overlay = document.createElement('div');
      overlay.id = 'anti-moral-overlay';
      overlay.innerHTML = `
        <h1>⚠️ XÂM PHẠM WEB</h1>
        <div class="sub">— Đạo lý làm người —</div>
        <div class="content">
          ${DAO_LY.map(l => l ? `<div>${l}</div>` : '<br>').join('')}
        </div>
        <div class="footer">"Hãy sống tốt, làm người tử tế. Nhân quả sẽ đến với tất cả."</div>
      `;
      document.body.appendChild(overlay);
    };

    // Silent block for everything
    const blockEventHard = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const events = ['contextmenu', 'copy', 'cut', 'paste', 'selectstart', 'dragstart'];
    events.forEach(ev => document.addEventListener(ev, blockEventHard, true));

    // F12 and dev keys → SILENT block, no toast
    const blockKeys = (e: KeyboardEvent) => {
      const isBadKey =
        e.key === 'F12' ||
        e.key === 'PrintScreen' || e.key === 'PrtScn' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'));
      if (isBadKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener('keydown', blockKeys, true);

    // DevTools detection: debugger trick
    const devtoolsDetect = setInterval(() => {
      const start = performance.now();
      debugger;
      const end = performance.now();
      if (end - start > 100) {
        clearInterval(devtoolsDetect);
        clearInterval(reattachInterval);
        showMoralLesson();
      }
    }, 2000);

    // DevTools detection: dimension trick
    const dimensionCheck = setInterval(() => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        clearInterval(devtoolsDetect);
        clearInterval(dimensionCheck);
        clearInterval(reattachInterval);
        showMoralLesson();
      }
    }, 2000);

    // Re-attach every 800ms
    const reattachInterval = setInterval(() => {
      events.forEach(ev => document.addEventListener(ev, blockEventHard, true));
      document.removeEventListener('keydown', blockKeys, true);
      document.addEventListener('keydown', blockKeys, true);
    }, 800);

    // Anti-iframe
    if (window.top !== window.self && window.top) {
      window.top.location.href = window.self.location.href;
    }

    return () => {
      const ms = document.getElementById('anti-moral-style');
      if (ms) ms.remove();
      const ol = document.getElementById('anti-moral-overlay');
      if (ol) ol.remove();
      events.forEach(ev => document.removeEventListener(ev, blockEventHard, true));
      document.removeEventListener('keydown', blockKeys, true);
      clearInterval(devtoolsDetect);
      clearInterval(dimensionCheck);
      clearInterval(reattachInterval);
    };
  }, [pathname]);

  return null;
}
