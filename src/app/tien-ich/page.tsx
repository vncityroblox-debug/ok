import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import styles from './tienich.module.css';

const utilities = [
  {
    title: 'Lấy Mã 2FA',
    description: 'Tạo mã xác thực 2 bước (TOTP) từ secret key. Tự động làm mới mỗi 30 giây, hỗ trợ nhiều tài khoản.',
    href: '/tien-ich/2fa',
    icon: ShieldCheck,
  },
];

export default function TienIchPage() {
  return (
    <div className="container">
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Kho <span>Tiện Ích</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Công cụ trực tuyến miễn phí, nhanh gọn và bảo mật — chạy ngay trên trình duyệt của bạn.
        </p>
      </section>

      <section className={styles.grid}>
        {utilities.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`glass-panel ${styles.card}`}>
              <div className={styles.cardIcon}>
                <Icon size={28} />
              </div>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardDesc}>{item.description}</p>
              <span className={styles.cardLink}>
                Mở công cụ
                <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
