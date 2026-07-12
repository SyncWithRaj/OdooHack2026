import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderTree,
  FileSpreadsheet,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  Settings,
  History,
  LogOut,
  Bell,
  Menu,
  X,
  BarChart3
} from 'lucide-react';
import Avatar from './Avatar';

export default function Sidebar({ children, user, onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Load notifications from local storage / API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.filter(n => !n.isRead));
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      router.push('/activity');
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { label: 'Asset Directory', path: '/assets', icon: FolderTree, roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { label: 'Allocations & Transfers', path: '/allocations', icon: FileSpreadsheet, roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { label: 'Resource Booking', path: '/bookings', icon: CalendarDays, roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['employee', 'department_head', 'asset_manager', 'admin'] },
    { label: 'Asset Audit', path: '/audit', icon: ClipboardCheck, roles: ['asset_manager', 'admin'] },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['asset_manager', 'admin'] },
    { label: 'Org Setup', path: '/org-setup', icon: Settings, roles: ['admin'] },
    { label: 'Activity Logs', path: '/activity', icon: History, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Sidebar background: --ink (#1B2429) */}
      <aside className="hidden md:flex md:w-64 bg-ink text-white flex-col flex-shrink-0 z-30">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-accent rounded-[4px] rotate-45"></span>
            <span className="font-bold text-lg font-display tracking-wider">ASSETFLOW</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[6px] text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-accent text-accent-ink font-semibold'
                    : 'text-steel hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Footer Panel */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name || 'Employee'} size="sm" />
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-white">{user?.name || 'Loading...'}</p>
              <p className="text-[10px] font-mono text-steel uppercase tracking-wider truncate">
                {user?.role?.replace('_', ' ') || 'employee'}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 text-steel hover:text-white hover:bg-white/5 rounded-[4px] cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-16 bg-ink text-white flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1 hover:bg-white/5 rounded-[4px] cursor-pointer"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-accent rounded-[4px] rotate-45"></span>
          <span className="font-bold text-base font-display tracking-wider">ASSETFLOW</span>
        </div>
        <button onClick={onLogout} className="p-1 hover:bg-white/5 rounded-[4px] cursor-pointer">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-ink/90 backdrop-blur-xs pt-16 flex flex-col">
          <nav className="flex-1 px-6 py-8 space-y-3 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setIsMobileOpen(false);
                    router.push(item.path);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[6px] text-base font-medium cursor-pointer ${
                    isActive ? 'bg-accent text-accent-ink font-semibold' : 'text-steel'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Panel */}
        <header className="h-16 border-b border-hairline bg-surface-raised flex items-center justify-between px-6 z-10 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-medium bg-surface px-2.5 py-1 rounded-[4px] border border-hairline uppercase text-steel">
              {user?.department?.name || 'Global'}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 hover:bg-surface rounded-full text-steel hover:text-ink relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-lost rounded-full border-2 border-surface-raised animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-36 w-80 bg-surface-raised border border-hairline rounded-[10px] shadow-xl z-30 py-2">
                <div className="px-4 py-2 border-b border-hairline flex justify-between items-center bg-surface">
                  <span className="font-semibold text-xs text-steel uppercase tracking-wider">Unread Alerts</span>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/notifications/read-all`, {
                          method: 'PATCH',
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setNotifications([]);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="text-[10px] font-mono text-status-lost hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-steel">No new notifications.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className="px-4 py-3 hover:bg-surface border-b border-hairline last:border-b-0 cursor-pointer flex flex-col gap-1"
                      >
                        <span className="font-semibold text-xs text-ink">{notif.title}</span>
                        <span className="text-[11px] text-steel leading-tight">{notif.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="h-6 w-[1px] bg-hairline"></div>

            {/* Profile Brief */}
            <div className="flex items-center gap-3">
              <Avatar name={user?.name || 'Employee'} size="sm" />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-ink leading-none">{user?.name || 'Employee'}</p>
                <p className="text-[10px] font-mono text-steel uppercase tracking-wider mt-0.5">
                  {user?.role?.replace('_', ' ') || 'employee'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Children content page */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
