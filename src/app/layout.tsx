import './globals.css';
import { getSupabaseServer } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnnouncementPopup from '@/components/AnnouncementPopup';
import ProtectionProvider from '@/components/ProtectionProvider';

export async function generateMetadata() {
  try {
    const supabase = getSupabaseServer();
    const { data: settings } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settings) {
      return {
        title: {
          default: settings.seo_title || 'App Share Platform',
          template: `%s | ${settings.site_name || 'App Share'}`,
        },
        description: settings.seo_description || 'Download apps and read latest articles',
        keywords: settings.seo_tags || ['apps', 'download', 'blog'],
        icons: {
          icon: settings.favicon_url || settings.site_icon_url || '/favicon.ico',
        },
        openGraph: {
          title: settings.seo_title || 'App Share Platform',
          description: settings.seo_description || 'Download apps and read latest articles',
          images: settings.seo_thumbnail_url ? [settings.seo_thumbnail_url] : [],
        },
      };
    }
  } catch (e) {
    console.error('Failed to generate dynamic metadata:', e);
  }

  return {
    title: {
      default: 'App Share Platform',
      template: '%s | App Share',
    },
    description: 'Download apps and read latest articles',
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let siteName = 'App Store';
  let siteIconUrl = '';
  let siteDescription = '';
  let footerText = '';
  let theme = 'light';

  try {
    const supabase = getSupabaseServer();
    const { data: settings } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settings) {
      siteName = settings.site_name || 'App Store';
      siteIconUrl = settings.site_icon_url || '';
      siteDescription = settings.seo_description || '';
      footerText = settings.footer_text || '';
      theme = settings.theme || 'light';
    }
  } catch (e) {
    console.error('Failed to load settings in layout:', e);
  }

  return (
    <html lang="vi" data-theme={theme}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <script dangerouslySetInnerHTML={{
          __html: `
/* ============================================================
   ╔═══════════════════════════════════════════════════════════╗
   ║            ĐẠO LÝ LÀM NGƯỜI - NHÂN QUẢ BÁO ỨNG          ║
   ╠═══════════════════════════════════════════════════════════╣
   ║  "Đối xử với người khác như cách bạn muốn                ║
   ║   được đối xử"                                           ║
   ║                                                          ║
   ║  Người xưa dạy: "Tiên học lễ, hậu học văn".             ║
   ║  Học làm người trước, học kiến thức sau.                 ║
   ║  Một người có tài mà không có đức thì cũng               ║
   ║  như con thú dữ.                                         ║
   ║                                                          ║
   ║  XÂM PHẠM WEB CỦA NGƯỜI KHÁC LÀ:                        ║
   ║  • Vi phạm pháp luật                                     ║
   ║  • Vi phạm đạo đức                                       ║
   ║  • Tự hạ thấp giá trị bản thân                          ║
   ║                                                          ║
   ║  NHÂN QUẢ - KHÔNG AI THOÁT ĐƯỢC                         ║
   ║  Mọi hành động đều có hệ quả.                            ║
   ║  Gió bão táp không thể che được mặt trời,                ║
   ║  tội lỗi không thể che được sự thật.                     ║
   ║                                                          ║
   ║  Hãy sống tốt, làm người tử tế.                          ║
   ║  Nhân quả sẽ đến với tất cả.                             ║
   ╚═══════════════════════════════════════════════════════════╝
   ============================================================ */

(function(){
  try {
    if (location.pathname.startsWith('/admin')) return;

    function isTextOrImage(t) {
      if (!t) return false;
      var tag = (t.tagName || '').toUpperCase();
      if (tag === 'IMG' || tag === 'SVG' || tag === 'CANVAS' || tag === 'VIDEO') return true;
      for (var i = 0; i < t.childNodes.length; i++) {
        if (t.childNodes[i].nodeType === 3 && (t.childNodes[i].textContent || '').trim()) return true;
      }
      return false;
    }

    // Block events silently
    var blockEvent = function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    var events = ['contextmenu','copy','cut','paste','selectstart','dragstart'];

    var bindAll = function() {
      for (var i = 0; i < events.length; i++) {
        document.addEventListener(events[i], blockEvent, true);
      }
    };
    bindAll();

    // F12/dev keys: SILENT block, no toast
    var blockKeys = function(e) {
      if (
        e.key === 'F12' ||
        e.key === 'PrintScreen' || e.key === 'PrtScn' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener('keydown', blockKeys, true);

    // Re-bind every 500ms
    setInterval(bindAll, 500);
    setInterval(function() {
      document.removeEventListener('keydown', blockKeys, true);
      document.addEventListener('keydown', blockKeys, true);
    }, 500);
  } catch(e) {}
})();
`
        }} />
      </head>
      <body>
        <Header siteName={siteName} siteIconUrl={siteIconUrl} />
        <ProtectionProvider />
        <main style={{ minHeight: 'calc(100vh - 250px)' }}>
          {children}
        </main>
        <Footer siteName={siteName} siteIconUrl={siteIconUrl} siteDescription={siteDescription} footerText={footerText} />
        <AnnouncementPopup />
      </body>
    </html>
  );
}
