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
  Shield
} from 'lucide-react';

const Sidebar = ({ user }) => {
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
    { name: 'Deliveries', href: '/deliveries', icon: Package },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Drivers', href: '/drivers', icon: UserCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : regularNavItems;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">LogiTrack</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-full">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;