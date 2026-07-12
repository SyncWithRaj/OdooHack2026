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
  CalendarDays,
  BarChart3,
  Activity
} from 'lucide-react';

const getNavigation = (role) => {
  const routes = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'assets', name: 'Assets', icon: Package, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'asset-requests', name: 'Asset Requests', icon: Package, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'allocations', name: 'Allocations', icon: ArrowRightLeft, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'transfers', name: 'Transfers', icon: ArrowRightLeft, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'bookings', name: 'Bookings', icon: CalendarDays, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
    { id: 'employees', name: 'Employees', icon: Users, roles: ['admin'] },
    { id: 'departments', name: 'Departments', icon: Building2, roles: ['admin'] },
    { id: 'categories', name: 'Categories', icon: Tags, roles: ['admin'] },
    { id: 'audits', name: 'Audits', icon: ClipboardCheck, roles: ['admin', 'asset_manager'] },
    { id: 'analytics', name: 'Analytics & Reports', icon: BarChart3, roles: ['admin', 'asset_manager'] },
    { id: 'activity-logs', name: 'Activity Logs', icon: Activity, roles: ['admin'] },
  ];

  return routes.filter(route => route.roles.includes(role || 'employee'));
};

export default function Sidebar({ role, activeTab, setActiveTab }) {
  const navigation = getNavigation(role);

  return (
    <div className="flex flex-col w-64 bg-ink border-r border-hairline h-screen fixed select-none z-30">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-2 h-16 border-b border-hairline/15 px-6">
        {/* Stamped physical look element */}
        <div className="w-5 h-5 bg-accent rounded-[4px] flex items-center justify-center font-bold text-accent-ink text-[11px] font-mono shadow-sm">
          A
        </div>
        <span className="text-lg font-bold font-display text-white tracking-widest uppercase">
          Asset<span className="text-accent font-light">Flow</span>
        </span>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-4 space-y-1.5">
          {navigation.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full group flex items-center px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-150 text-left
                  ${isActive 
                    ? 'bg-accent text-accent-ink shadow-md' 
                    : 'text-steel hover:text-white hover:bg-white/5'}
                `}
              >
                <item.icon
                  className={`
                    flex-shrink-0 mr-3 h-4.5 w-4.5 transition-colors
                    ${isActive ? 'text-accent-ink' : 'text-steel group-hover:text-white'}
                  `}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-hairline/15 bg-white/2">
        <div className="flex items-center justify-between text-[10px] text-steel font-semibold tracking-wider uppercase">
          <span>Module status</span>
          <span className="text-status-available animate-pulse">● online</span>
        </div>
      </div>
    </div>
  );
}
