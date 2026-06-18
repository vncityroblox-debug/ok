'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  FolderOpen,
  AppWindow,
  KeyRound,
  FileText,
  LogOut,
  Terminal,
  UserCog,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '@/app/admin/admin.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Thống Kê', path: '/admin', icon: LayoutDashboard },
    { name: 'Cấu Hình Web', path: '/admin/settings', icon: Settings },
    { name: 'Danh Mục', path: '/admin/categories', icon: FolderOpen },
    { name: 'Đăng Ứng Dụng', path: '/admin/apps', icon: AppWindow },
    { name: 'Đăng Mã Nguồn', path: '/admin/source-codes', icon: Terminal },
    { name: 'Quản Lý Key', path: '/admin/keys', icon: KeyRound },
    { name: 'Viết Bài (Blog)', path: '/admin/posts', icon: FileText },
    { name: 'Quản Lý Admin', path: '/admin/users', icon: UserCog },
  ];

  const handleLogout = async () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi Admin?')) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      router.push('/');
      router.refresh();
    }
  };

  return (
    <aside className={styles.sidebar}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`${styles.sidebarLink} ${isActive ? styles.activeSidebarLink : ''}`}
          >
            <Icon size={20} />
            <span>{item.name}</span>
          </Link>
        );
      })}

      <button onClick={handleLogout} className={styles.logoutBtn}>
        <LogOut size={20} />
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}
