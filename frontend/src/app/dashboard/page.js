'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, User as UserIcon } from 'lucide-react';

// Import Sidebar
import Sidebar from '../../components/layout/Sidebar';

// Import Tabs (we will create these next)
import OverviewTab from '../../components/tabs/OverviewTab';
import AssetsTab from '../../components/tabs/AssetsTab';
import AllocationsTab from '../../components/tabs/AllocationsTab';
import MaintenanceTab from '../../components/tabs/MaintenanceTab';
import EmployeesTab from '../../components/tabs/EmployeesTab';

// Stub for tabs not yet fully implemented
const ComingSoonTab = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-gray-200">
    <h3 className="text-xl font-medium text-gray-900">{title}</h3>
    <p className="mt-2 text-gray-500">This module is under construction.</p>
  </div>
);

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  // Default tab based on role
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render the correct tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={user} />;
      case 'assets':
        return <AssetsTab user={user} />;
      case 'allocations':
        return <AllocationsTab user={user} />;
      case 'maintenance':
        return <MaintenanceTab user={user} />;
      case 'employees':
        return <EmployeesTab user={user} />;
      case 'departments':
        return <ComingSoonTab title="Departments Management" />;
      case 'categories':
        return <ComingSoonTab title="Asset Categories" />;
      case 'audits':
        return <ComingSoonTab title="Audit Cycles" />;
      case 'transfers':
        return <ComingSoonTab title="Asset Transfers" />;
      case 'bookings':
        return <ComingSoonTab title="Resource Bookings" />;
      default:
        return <OverviewTab user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar controls the activeTab state */}
      <Sidebar role={user.role} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-gray-500 relative">
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
              <Bell className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">{user.department?.name || 'Unassigned'}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UserIcon className="h-5 w-5" />
              </div>
              <button
                onClick={logout}
                className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
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
