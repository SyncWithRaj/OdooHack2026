'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, User as UserIcon, Check } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Import Sidebar
import Sidebar from '../../components/layout/Sidebar';

// Import Tabs
import OverviewTab from '../../components/tabs/OverviewTab';
import AssetsTab from '../../components/tabs/AssetsTab';
import AllocationsTab from '../../components/tabs/AllocationsTab';
import MaintenanceTab from '../../components/tabs/MaintenanceTab';
import EmployeesTab from '../../components/tabs/EmployeesTab';
import DepartmentsTab from '../../components/tabs/DepartmentsTab';
import CategoriesTab from '../../components/tabs/CategoriesTab';
import AuditsTab from '../../components/tabs/AuditsTab';
import TransfersTab from '../../components/tabs/TransfersTab';
import BookingsTab from '../../components/tabs/BookingsTab';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [assetsTriggerRefresh, setAssetsTriggerRefresh] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close notifications panel on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold uppercase tracking-wider text-steel">Loading AssetFlow...</span>
        </div>
      </div>
    );
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success('All notifications marked as read');
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  // Render the correct tab content
  const renderTabContent = () => {
    const props = { 
      user, 
      setActiveTab,
      assetsTriggerRefresh,
      refreshAssets: () => setAssetsTriggerRefresh(prev => prev + 1)
    };

    switch (activeTab) {
      case 'overview':
        return <OverviewTab {...props} />;
      case 'assets':
        return <AssetsTab {...props} />;
      case 'allocations':
        return <AllocationsTab {...props} />;
      case 'transfers':
        return <TransfersTab {...props} />;
      case 'maintenance':
        return <MaintenanceTab {...props} />;
      case 'bookings':
        return <BookingsTab {...props} />;
      case 'employees':
        return <EmployeesTab {...props} />;
      case 'departments':
        return <DepartmentsTab {...props} />;
      case 'categories':
        return <CategoriesTab {...props} />;
      case 'audits':
        return <AuditsTab {...props} />;
      default:
        return <OverviewTab {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar controls the activeTab state */}
      <Sidebar role={user.role} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-hairline h-16 flex items-center justify-between px-8 shrink-0 relative z-40">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-ink uppercase tracking-wider">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-steel hover:text-ink relative p-1 rounded-md hover:bg-surface transition-colors"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-status-lost ring-2 ring-white" />
                )}
                <Bell className="h-5 w-5" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-hairline rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-hairline flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-steel">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllRead} 
                        className="text-xs font-semibold text-accent hover:underline bg-transparent border-none cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-hairline">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-steel">
                        No notifications.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`px-4 py-3 flex items-start justify-between gap-2 hover:bg-surface/50 transition-colors ${
                            !notif.isRead ? 'bg-accent/5' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-xs font-bold text-ink">{notif.title}</p>
                            <p className="text-xs text-steel mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-steel/60 font-mono mt-1">
                              {new Date(notif.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={() => markRead(notif.id)}
                              className="text-accent hover:text-accent-ink p-0.5 rounded hover:bg-accent/10"
                              title="Mark as read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 border-l border-hairline pl-6">
              <div className="flex flex-col text-right">
                <span className="text-sm font-semibold text-ink">{user.name}</span>
                <span className="text-xs text-steel font-medium capitalize">{user.role.replace('_', ' ')}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <UserIcon className="h-4.5 w-4.5" />
              </div>
              <button
                onClick={logout}
                className="ml-2 text-steel hover:text-status-lost transition-colors p-1 rounded hover:bg-surface"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}
