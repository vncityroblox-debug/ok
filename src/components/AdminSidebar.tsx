'use client';

import { useState, useEffect } from 'react';
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
  Users,
  X,
  ShieldCheck,
  MessageSquare,
  ChevronDown,
  Activity,
  Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from '@/app/admin/admin.module.css';

interface NavGroup {
  label: string;
  items: { name: string; path: string; icon: any }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Tổng Quát',
    items: [
      { name: 'Thống Kê', path: '/admin', icon: LayoutDashboard },
      { name: 'Nhật Ký', path: '/admin/activity', icon: Activity },
    ],
  },
  {
    label: 'Nội Dung',
    items: [
      { name: 'Danh Mục', path: '/admin/categories', icon: FolderOpen },
      { name: 'Ứng Dụng', path: '/admin/apps', icon: AppWindow },
      { name: 'Mã Nguồn', path: '/admin/source-codes', icon: Terminal },
      { name: 'Quản Lý Key', path: '/admin/keys', icon: KeyRound },
      { name: 'Blog', path: '/admin/posts', icon: FileText },
    ],
  },
  {
    label: 'Người Dùng',
    items: [
      { name: 'Quản Lý Admin', path: '/admin/users', icon: UserCog },
      { name: 'Người Dùng', path: '/admin/user-management', icon: Users },
      { name: 'Xác Thực Zalo', path: '/admin/zalo-verification', icon: ShieldCheck },
    ],
  },
  {
    label: 'Hệ Thống',
    items: [
      { name: 'Cấu Hình Web', path: '/admin/settings', icon: Settings },
      { name: 'Chatbot Zalo', path: '/admin/chatbot', icon: MessageSquare },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('site_icon_url')
          .eq('id', 1)
          .single();
        if (data?.site_icon_url) setLogoUrl(data.site_icon_url);
      } catch {}
    })();
  }, []);

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi Admin?')) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Logout error:', error);
      router.push('/');
      router.refresh();
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarHeader}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className={styles.sidebarLogo} />
        ) : (
          <div className={styles.sidebarLogoPlaceholder}>Admin</div>
        )}
        <button className={styles.sidebarCloseBtn} onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <nav className={styles.sidebarNav}>
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups[group.label];
          const hasActive = group.items.some(item => pathname === item.path);

          return (
            <div key={group.label} className={styles.navGroup}>
              <button
                className={`${styles.navGroupHeader} ${hasActive ? styles.navGroupHeaderActive : ''}`}
                onClick={() => toggleGroup(group.label)}
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              {!isCollapsed && (
                <div className={styles.navGroupItems}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.sidebarLink} ${isActive ? styles.activeSidebarLink : ''}`}
                        onClick={onClose}
                      >
                        <Icon size={18} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        <LogOut size={18} />
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}
