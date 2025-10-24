'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building,
  Users,
  Truck,
  Package,
  UserCheck,
  Settings,
  BarChart3,
  Shield,
  ChevronLeft,
  X,
  Receipt,
  Wrench,
  TrendingUp
} from 'lucide-react';

const Sidebar = ({ user, isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
  const pathname = usePathname();

  const isAdmin = user?.role === 'SUPER_ADMIN';

  const adminNavItems = [
    { name: 'System Admin', href: '/admin', icon: Shield },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const regularNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vehicles', href: '/vehicles', icon: Truck },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Deliveries', href: '/deliveries', icon: Package },
    { name: 'Drivers', href: '/drivers', icon: UserCheck },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Sales/Revenue', href: '/sales', icon: TrendingUp },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : regularNavItems;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            {!isCollapsed && (
              <div className="flex items-center">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-semibold text-gray-900">LogiTrack</span>
              </div>
            )}
            
            {isCollapsed && (
              <div className="bg-blue-600 p-2 rounded-lg mx-auto">
                <Truck className="w-6 h-6 text-white" />
              </div>
            )}

            {/* Desktop Toggle */}
            <button
              onClick={onToggle}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Close */}
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => onMobileClose?.()}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  
                  {!isCollapsed && (
                    <span className="ml-3 truncate">{item.name}</span>
                  )}
                  
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 p-3">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="bg-gray-100 p-2 rounded-full shrink-0">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              {!isCollapsed && (
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;