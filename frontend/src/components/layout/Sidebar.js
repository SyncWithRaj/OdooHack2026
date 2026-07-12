'use client';

import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Wrench, 
  ClipboardCheck, 
  Building2,
  Tags,
  ArrowRightLeft,
  CalendarDays
} from 'lucide-react';

const getNavigation = (role) => {
  const routes = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'assets', name: 'Assets', icon: Package, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'allocations', name: 'Allocations', icon: ArrowRightLeft, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'transfers', name: 'Transfers', icon: ArrowRightLeft, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'bookings', name: 'Bookings', icon: CalendarDays, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'employees', name: 'Employees', icon: Users, roles: ['admin'] },
    { id: 'departments', name: 'Departments', icon: Building2, roles: ['admin'] },
    { id: 'categories', name: 'Categories', icon: Tags, roles: ['admin'] },
    { id: 'audits', name: 'Audits', icon: ClipboardCheck, roles: ['admin', 'asset_manager'] },
  ];

  return routes.filter(route => route.roles.includes(role || 'employee'));
};

export default function Sidebar({ role, activeTab, setActiveTab }) {
  const navigation = getNavigation(role);

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4">
        <span className="text-2xl font-bold text-blue-600 tracking-tight">AssetFlow</span>
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
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                <item.icon
                  className={`
                    flex-shrink-0 -ml-1 mr-3 h-5 w-5
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
