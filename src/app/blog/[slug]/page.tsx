'use client';

import { useState, useEffect, use } from 'react';
import { Calendar, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import styles from '../../home.module.css';

interface PostDetails {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
}

export default function BlogPostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [post, setPost] = useState<PostDetails | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadPostDetails() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/public?type=post&slug=${encodeURIComponent(slug)}`);
        const json = await res.json();

        if (!json.data) {
          setErrorMessage('Không tìm thấy bài viết yêu cầu.');
        } else {
          setPost(json.data);
        }
      } catch (err) {
        console.error('Blog load error:', err);
        setErrorMessage('Lỗi hệ thống khi tải bài viết.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPostDetails();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <p style={{ color: 'hsl(var(--text-secondary))' }}>Đang tải bài viết...</p>
      </div>
    );
  }

  if (errorMessage && !post) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2 style={{ marginBottom: '20px' }}>{errorMessage}</h2>
        <Link href="/blog" className="neon-btn">
          <ArrowLeft size={16} /> Quay lại danh sách bài viết
        </Link>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="container" style={{ padding: '20px 24px' }}>
      <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--text-secondary))', marginBottom: '30px', fontWeight: 500 }} className="hover:text-white">
        <ArrowLeft size={16} /> Quay lại danh sách
      </Link>

      <article className={`${styles.articleLayout} glass-panel`}>
        <h1 className={styles.articleTitle}>{post.title}</h1>
        
        <div className={styles.blogMeta} style={{ marginBottom: '32px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            {new Date(post.created_at).toLocaleDateString('vi-VN', {
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} />
            Bài viết
          </span>
        </div>

        {/* Render HTML content safely inside styled container */}
        <div
          className={styles.articleContent}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
