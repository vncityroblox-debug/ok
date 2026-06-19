'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Search, Film, Globe, Calendar, Tag, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import styles from './phim.module.css';

interface MovieItem {
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
  episode_current: string;
  modified: { time: string };
}

interface ApiResponse {
  status: boolean;
  data: {
    items: MovieItem[];
    params: {
      pagination: {
        totalPages: number;
        totalItems: number;
        currentPage: number;
        perPage: number;
      };
    };
  };
}

const CATEGORIES = [
  { name: 'Hành Động', slug: 'hanh-dong' },
  { name: 'Tình Cảm', slug: 'tinh-cam' },
  { name: 'Hài Hước', slug: 'hai-huoc' },
  { name: 'Cổ Trang', slug: 'co-trang' },
  { name: 'Tâm Lý', slug: 'tam-ly' },
  { name: 'Hình Sự', slug: 'hinh-su' },
  { name: 'Chiến Tranh', slug: 'chien-tranh' },
  { name: 'Thể Thao', slug: 'the-thao' },
  { name: 'Võ Thuật', slug: 'vo-thuat' },
  { name: 'Viễn Tưởng', slug: 'vien-tuong' },
  { name: 'Phiêu Lưu', slug: 'phieu-luu' },
  { name: 'Khoa Học', slug: 'khoa-hoc' },
  { name: 'Kinh Dị', slug: 'kinh-di' },
  { name: 'Âm Nhạc', slug: 'am-nhac' },
  { name: 'Chính Kịch', slug: 'chinh-kich' },
  { name: 'Bí Ẩn', slug: 'bi-an' },
  { name: 'Thần Thoại', slug: 'than-thoai' },
  { name: 'Gia Đình', slug: 'gia-dinh' },
  { name: 'Chiếu Rạp', slug: 'chieu-rap' },
  { name: 'Phim 18+', slug: 'phim-18' },
];

const COUNTRIES = [
  { name: 'Hàn Quốc', slug: 'han-quoc' },
  { name: 'Trung Quốc', slug: 'trung-quoc' },
  { name: 'Nhật Bản', slug: 'nhat-ban' },
  { name: 'Âu Mỹ', slug: 'au-my' },
  { name: 'Thái Lan', slug: 'thai-lan' },
  { name: 'Đài Loan', slug: 'dai-loan' },
  { name: 'Ấn Độ', slug: 'an-do' },
  { name: 'Anh', slug: 'anh' },
  { name: 'Pháp', slug: 'phap' },
  { name: 'Việt Nam', slug: 'viet-nam' },
];

const YEARS = Array.from({ length: 27 }, (_, i) => 2026 - i);

function PhimHayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get('country') || '');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');

  const typeList = selectedType || 'phim-moi-cap-nhat';

  useEffect(() => {
    fetchMovies();
  }, [currentPage, selectedCategory, selectedCountry, selectedYear, selectedType]);

  async function fetchMovies() {
    setIsLoading(true);
    try {
      let url: string;
      const keyword = searchParams.get('keyword');

      if (keyword) {
        const params = new URLSearchParams({
          keyword,
          page: String(currentPage),
          sort_field: 'modified.time',
          sort_type: 'desc',
          limit: '24',
        });
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedYear) params.set('year', selectedYear);
        url = `https://phimapi.com/v1/api/tim-kiem?${params.toString()}`;
      } else {
        const params = new URLSearchParams({
          page: String(currentPage),
          sort_field: 'modified.time',
          sort_type: 'desc',
          limit: '24',
        });
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedCountry) params.set('country', selectedCountry);
        if (selectedYear) params.set('year', selectedYear);
        url = `https://phimapi.com/v1/api/danh-sach/${typeList}?${params.toString()}`;
      }

      const res = await fetch(url);
      const json: ApiResponse = await res.json();

      if (json.status && json.data) {
        setMovies(json.data.items || []);
        setTotalPages(json.data.params?.pagination?.totalPages || 1);
      } else {
        setMovies([]);
      }
    } catch (err) {
      console.error('Fetch movies error:', err);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('keyword', searchQuery.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedYear) params.set('year', selectedYear);
    router.push(`/phim-hay?${params.toString()}`);
    setTimeout(fetchMovies, 0);
  };

  const handleFilterChange = (type: string, value: string) => {
    setCurrentPage(1);
    if (type === 'category') setSelectedCategory(value);
    else if (type === 'country') setSelectedCountry(value);
    else if (type === 'year') setSelectedYear(value);
    else if (type === 'filmType') setSelectedType(value);
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="container">
      <Breadcrumbs />

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Phim <span>Hay</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Xem phim online miễn phí với chất lượng cao, cập nhật nhanh nhất.
        </p>
      </section>

      <form onSubmit={handleSearch}>
        <div className={styles.searchBarWrapper}>
          <Search size={20} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Tìm kiếm phim..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            <Search size={16} /> Tìm
          </button>
        </div>
      </form>

      <div className={styles.filterBar}>
        <select className={styles.filterSelect} value={selectedType} onChange={(e) => handleFilterChange('filmType', e.target.value)}>
          <option value="">Tất cả</option>
          <option value="phim-bo">Phim Bộ</option>
          <option value="phim-le">Phim Lẻ</option>
          <option value="tv-shows">TV Shows</option>
          <option value="hoat-hinh">Hoạt Hình</option>
        </select>

        <select className={styles.filterSelect} value={selectedCategory} onChange={(e) => handleFilterChange('category', e.target.value)}>
          <option value="">Thể Loại</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select className={styles.filterSelect} value={selectedCountry} onChange={(e) => handleFilterChange('country', e.target.value)}>
          <option value="">Quốc Gia</option>
          {COUNTRIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select className={styles.filterSelect} value={selectedYear} onChange={(e) => handleFilterChange('year', e.target.value)}>
          <option value="">Năm</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải danh sách phim...</p>
        </div>
      ) : movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', borderRadius: '16px', border: '1px dashed hsl(var(--border-glass))' }}>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Không tìm thấy phim nào.</p>
        </div>
      ) : (
        <div className={styles.movieGrid}>
          {movies.map((movie) => (
            <Link key={movie.slug} href={`/phim-${movie.slug}`} className={styles.movieCard}>
              <img
                src={movie.poster_url || movie.thumb_url}
                alt={movie.name}
                className={styles.moviePoster}
                loading="lazy"
              />
              <span className={`${styles.movieBadge} ${styles.badgeYear}`}>{movie.year}</span>
              {movie.episode_current && (
                <span className={styles.badgeEp}>{movie.episode_current}</span>
              )}
              <div className={styles.movieInfo}>
                <div className={styles.movieName}>{movie.name}</div>
                <div className={styles.movieMeta}>{movie.origin_name}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          {renderPageNumbers().map((p, i) =>
            typeof p === 'string' ? (
              <span key={`dots-${i}`} style={{ color: 'hsl(var(--text-muted))', padding: '0 4px' }}>...</span>
            ) : (
              <button
                key={p}
                className={`${styles.pageBtn} ${currentPage === p ? styles.pageBtnActive : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className={styles.pageBtn}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PhimHayPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px 0', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>Đang tải...</div>}>
      <PhimHayContent />
    </Suspense>
  );
}
