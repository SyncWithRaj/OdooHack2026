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
  Activity,
  User as UserIcon,
  Bell
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
    { id: 'analytics', name: 'Analytics & Reports', icon: BarChart3, roles: ['admin', 'asset_manager'] },
    { id: 'activity-logs', name: 'Activity Logs', icon: Activity, roles: ['admin'] },
    { id: 'notifications', name: 'Notifications', icon: Bell, roles: ['admin'] },
  ];

  return routes.filter(route => route.roles.includes(role || 'employee'));
};

export default function Sidebar({ user, role, activeTab, setActiveTab, unreadCount = 0 }) {
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
                <span className="truncate flex-1">{item.name}</span>
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className={`
                    ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${isActive ? 'bg-white/20 text-accent-ink' : 'bg-status-lost text-white'}
                  `}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Button */}
      <div className="p-4 border-t border-hairline/15 bg-white/5">
        <button
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left hover:bg-white/10 ${activeTab === 'profile' ? 'bg-white/10 ring-1 ring-accent/50' : ''}`}
        >
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 text-accent">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white truncate">{user?.name || 'User'}</span>
            <span className="text-[10px] text-steel font-semibold tracking-wider uppercase truncate">
              {user?.role?.replace('_', ' ') || 'Role'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
