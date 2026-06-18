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
          icon: settings.site_icon_url || '/favicon.ico',
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
        {/* Set up theme color and responsive viewports */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body>
        <Header siteName={siteName} siteIconUrl={siteIconUrl} />
        <ProtectionProvider />
        <main style={{ minHeight: 'calc(100vh - 250px)' }}>
          {children}
        </main>
        <Footer siteName={siteName} siteDescription={siteDescription} footerText={footerText} />
        <AnnouncementPopup />
      </body>
    </html>
  );
}
