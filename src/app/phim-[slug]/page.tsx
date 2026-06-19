'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Play, Film, Globe, Calendar, Tag, Clock, ArrowLeft } from 'lucide-react';
import styles from '../phim-hay/phim.module.css';

interface Episode {
  name: string;
  slug: string;
  embed: string;
}

interface ServerEpisodes {
  server_name: string;
  server_data: Episode[];
}

interface MovieDetail {
  slug: string;
  name: string;
  origin_name: string;
  year: number;
  poster_url: string;
  thumb_url: string;
  type: string;
  status: string;
  category: { name: string; slug: string }[];
  country: { name: string; slug: string }[];
  episodes: ServerEpisodes[];
  content: string;
  modified: { time: string };
  episode_current: string;
  episode_total: string;
  time: string;
  quality: string;
  lang: string;
}

interface RelatedMovie {
  slug: string;
  name: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  episode_current: string;
  type: string;
}

interface ApiResponse {
  status: boolean;
  data: {
    item: MovieDetail;
    related?: RelatedMovie[];
  };
}

function WatchPhimContent({ slug }: { slug: string }) {
  if (!slug) return null;
  const cleanSlug = slug.replace(/^phim-/, '');

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [related, setRelated] = useState<RelatedMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeServer, setActiveServer] = useState(0);
  const [activeEpisode, setActiveEpisode] = useState(0);
  const [currentEmbed, setCurrentEmbed] = useState('');

  useEffect(() => {
    async function loadMovie() {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch(`https://phimapi.com/phim/${cleanSlug}`);
        const json: ApiResponse = await res.json();

        if (json.status && json.data?.item) {
          setMovie(json.data.item);
          setRelated(json.data.related || []);

          const firstEp = json.data.item.episodes?.[0]?.server_data?.[0];
          if (firstEp) {
            setCurrentEmbed(firstEp.embed);
          }
        } else {
          setError('Không tìm thấy phim.');
        }
      } catch (err) {
        console.error('Load movie error:', err);
        setError('Lỗi khi tải thông tin phim.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMovie();
  }, [cleanSlug]);

  const handleServerChange = (serverIdx: number) => {
    setActiveServer(serverIdx);
    setActiveEpisode(0);
    const ep = movie?.episodes?.[serverIdx]?.server_data?.[0];
    if (ep) setCurrentEmbed(ep.embed);
  };

  const handleEpisodeChange = (serverIdx: number, epIdx: number) => {
    setActiveServer(serverIdx);
    setActiveEpisode(epIdx);
    const ep = movie?.episodes?.[serverIdx]?.server_data?.[epIdx];
    if (ep) setCurrentEmbed(ep.embed);
  };

  if (isLoading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải phim...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2 style={{ marginBottom: '20px', color: 'hsl(var(--text-primary))' }}>{error || 'Không tìm thấy phim'}</h2>
        <Link href="/phim-hay" className="neon-btn">
          <ArrowLeft size={16} /> Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px 24px' }}>
      <Breadcrumbs />

      <div className={styles.watchLayout}>
        <div>
          {/* Player */}
          <div className={styles.playerWrapper}>
            {currentEmbed ? (
              <iframe
                src={currentEmbed}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={`Xem ${movie.name}`}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                <p>Chọn tập để xem</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className={styles.watchInfo}>
            <h1 className={styles.watchTitle}>{movie.name}</h1>
            {movie.origin_name && <div className={styles.watchOriginTitle}>{movie.origin_name}</div>}

            <div className={styles.watchMeta}>
              {movie.year && <span className={styles.metaTag}><Calendar size={12} /> {movie.year}</span>}
              {movie.status && <span className={`${styles.metaTag} ${styles.primary}`}>{movie.status}</span>}
              {movie.time && <span className={styles.metaTag}><Clock size={12} /> {movie.time}</span>}
              {movie.quality && <span className={styles.metaTag}>{movie.quality}</span>}
              {movie.lang && <span className={styles.metaTag}>{movie.lang}</span>}
              {movie.episode_total && <span className={styles.metaTag}>Tổng tập: {movie.episode_total}</span>}
            </div>

            {movie.category?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {movie.category.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/phim-hay?category=${c.slug}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      background: 'hsl(var(--bg-subtle))',
                      color: 'hsl(var(--text-secondary))',
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}

            {movie.country?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {movie.country.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/phim-hay?country=${c.slug}`}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      background: 'rgba(13, 110, 253, 0.08)',
                      color: 'hsl(var(--color-primary))',
                      textDecoration: 'none',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Globe size={10} style={{ marginRight: '4px' }} />{c.name}
                  </Link>
                ))}
              </div>
            )}

            {movie.content && (
              <div
                className={styles.watchDesc}
                dangerouslySetInnerHTML={{ __html: movie.content }}
              />
            )}
          </div>

          {/* Episodes */}
          {movie.episodes?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'hsl(var(--text-primary))' }}>
                Danh Sách Tập
              </h3>

              <div className={styles.serverList}>
                {movie.episodes.map((server, sIdx) => (
                  <button
                    key={sIdx}
                    className={`${styles.serverBtn} ${activeServer === sIdx ? styles.serverBtnActive : ''}`}
                    onClick={() => handleServerChange(sIdx)}
                  >
                    {server.server_name}
                  </button>
                ))}
              </div>

              <div className={styles.episodeGrid}>
                {movie.episodes[activeServer]?.server_data?.map((ep, epIdx) => (
                  <button
                    key={ep.slug}
                    className={`${styles.epBtn} ${activeEpisode === epIdx ? styles.epBtnActive : ''}`}
                    onClick={() => handleEpisodeChange(activeServer, epIdx)}
                  >
                    {ep.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {related.length > 0 && (
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>
                <Film size={16} style={{ color: 'hsl(var(--color-primary))' }} />
                Phim Liên Quan
              </h3>
              {related.map((rm) => (
                <Link key={rm.slug} href={`/phim-${rm.slug}`} className={styles.sidebarCard}>
                  <img
                    src={rm.poster_url || rm.thumb_url}
                    alt={rm.name}
                    className={styles.sidebarPoster}
                    loading="lazy"
                  />
                  <div className={styles.sidebarCardInfo}>
                    <div className={styles.sidebarCardName}>{rm.name}</div>
                    <div className={styles.sidebarCardMeta}>{rm.origin_name}</div>
                    <div className={styles.sidebarCardMeta}>{rm.year} • {rm.episode_current}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>
              <Play size={16} style={{ color: 'hsl(var(--color-primary))' }} />
              Thể Loại
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {movie.category?.map((c) => (
                <Link
                  key={c.slug}
                  href={`/phim-hay?category=${c.slug}`}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    background: 'hsl(var(--bg-subtle))',
                    color: 'hsl(var(--text-secondary))',
                    textDecoration: 'none',
                  }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WatchPhimPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug;
  if (!slug) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải...</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<div style={{ padding: '60px 0', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>Đang tải phim...</div>}>
      <WatchPhimContent slug={slug} />
    </Suspense>
  );
}
