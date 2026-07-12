'use client';

import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft,
  CalendarDays,
  Wrench, 
  ClipboardCheck, 
  BarChart3,
  Bell,
  Building2
} from 'lucide-react';

const getNavigation = (role) => {
  const routes = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'org-setup', name: 'Organization setup', icon: Building2, roles: ['admin'] },
    { id: 'assets', name: 'Assets', icon: Package, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'allocations', name: 'Allocation & Transfer', icon: ArrowRightLeft, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'bookings', name: 'Resource Booking', icon: CalendarDays, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'audit', name: 'Audit', icon: ClipboardCheck, roles: ['admin', 'asset_manager'] },
    { id: 'reports', name: 'Reports', icon: BarChart3, roles: ['admin', 'asset_manager'] },
    { id: 'notifications', name: 'Notifications', icon: Bell, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
  ];

  return routes.filter(route => route.roles.includes(role || 'employee'));
};

export default function Sidebar({ role, activeTab, setActiveTab }) {
  const navigation = getNavigation(role);

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed">
      <div className="flex items-center h-16 border-b border-gray-200 px-6">
        <span className="text-2xl font-bold text-gray-900 tracking-tight">AssetFlow</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors text-left
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent'}
                `}
              >
                <item.icon
                  className={`
                    flex-shrink-0 mr-3 h-5 w-5
                    ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
