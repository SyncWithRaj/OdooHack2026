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
import { motion } from 'framer-motion';

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
    { id: 'notifications', name: 'Notifications', icon: Bell, roles: ['admin', 'asset_manager', 'department_head', 'employee'] },
  ];

  return routes.filter(route => route.roles.includes(role || 'employee'));
};

export default function Sidebar({ user, role, activeTab, setActiveTab, unreadCount = 0 }) {
  const navigation = getNavigation(role);

  return (
    <div className="flex flex-col w-64 bg-ink border-r border-hairline h-screen fixed select-none z-30">
      {/* Brand Logo Header */}
      <button 
        onClick={() => setActiveTab('overview')}
        className="flex items-center gap-3 h-16 border-b border-hairline/15 px-6 hover:bg-white/[0.03] transition-colors text-left w-full group/logo focus:outline-none cursor-pointer"
      >
        {/* Stamped physical look element */}
        <div className="w-6 h-6 bg-accent rounded-[6px] flex items-center justify-center font-bold text-accent-ink shadow-md shrink-0 group-hover/logo:scale-105 group-hover/logo:shadow-[0_0_12px_rgba(232,163,61,0.3)] transition-all duration-300">
          <svg className="w-4.5 h-4.5 text-accent-ink stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <span className="text-base font-black tracking-wider text-white font-display uppercase">
          ASSET<span className="text-accent font-light">FLOW</span>
        </span>
      </button>
      
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
                  w-full group flex items-center px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-md text-left relative overflow-hidden transition-all duration-150
                  ${isActive 
                    ? 'text-accent-ink shadow-sm' 
                    : 'text-steel hover:text-white hover:bg-white/5'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-pill"
                    className="absolute inset-0 bg-accent -z-10 rounded-md"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <item.icon
                  className={`
                    flex-shrink-0 mr-3 h-4.5 w-4.5 transition-colors relative z-10
                    ${isActive ? 'text-accent-ink' : 'text-steel group-hover:text-white'}
                  `}
                  aria-hidden="true"
                />
                <span className="truncate flex-1 relative z-10">{item.name}</span>
                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className={`
                    ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full relative z-10
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
