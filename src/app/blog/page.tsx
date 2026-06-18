'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import styles from '../home.module.css';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setPosts(data);
        }
      } catch (err) {
        console.error('Failed to load blog posts:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, []);

  // Simple utility to strip HTML tags for a clean excerpt
  const getExcerpt = (htmlContent: string) => {
    const cleanText = htmlContent.replace(/<\/?[^>]+(>|$)/g, '');
    return cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText;
  };

  return (
    <div className="container" id="guide-blog">
      {/* Header Banner */}
      <section className={styles.hero} style={{ padding: '60px 0 40px 0' }}>
        <h1 className={styles.heroTitle} style={{ fontSize: '3rem' }}>
          Bài Viết & <span>Chia Sẻ</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Nơi tổng hợp các bài viết hướng dẫn chi tiết, tin tức công nghệ mới và các mẹo sử dụng ứng dụng hữu ích.
        </p>
      </section>

      {/* Blog Posts Grid */}
      <section style={{ marginBottom: '80px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải danh sách bài viết...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'hsl(var(--text-muted))', textAlign: 'center' }}>Chưa có bài viết nào được đăng tải.</p>
          </div>
        ) : (
          <div className={styles.blogGrid}>
            {posts.map((post) => (
              <article key={post.id} className={styles.blogCard}>
                <h3 className={styles.blogTitle}>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>

                <div className={styles.blogMeta}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    {new Date(post.created_at).toLocaleDateString('vi-VN', {
                      day: 'numeric',
                      month: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} />
                    Blog
                  </span>
                </div>

                <p className={styles.blogExcerpt}>{getExcerpt(post.content)}</p>

                <Link href={`/blog/${post.slug}`} className="neon-btn-secondary" style={{ width: 'fit-content', padding: '6px 16px', fontSize: '0.85rem', marginTop: 'auto' }}>
                  Đọc thêm
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
