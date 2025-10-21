'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Building
} from 'lucide-react';

const Navbar = ({ user, onMobileMenuToggle, isCollapsed }) => {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  // Get company/tenant name
  const companyName = user?.tenant?.name || 'System Admin';
  const isSystemAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className={`fixed top-0 right-0 z-30 bg-white border-b border-gray-200 h-16 transition-all duration-300 ${
      isCollapsed ? 'left-16' : 'left-64'
    } lg:left-${isCollapsed ? '16' : '64'}`}>
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side - Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center - Search */}
        <div className="flex-1 max-w-lg mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm"
            />
          </div>
        </div>

        {/* Right side - Notifications & User menu */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 lg:space-x-3 p-2 rounded-lg hover:bg-gray-100"
            >
              <div className={`p-1.5 lg:p-2 rounded-full ${isSystemAdmin ? 'bg-red-600' : 'bg-blue-600'}`}>
                <User className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">{user?.name}</p>
                <div className="flex items-center text-xs text-gray-500">
                  {!isSystemAdmin && (
                    <>
                      <Building className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate max-w-24">{companyName}</span>
                    </>
                  )}
                  {isSystemAdmin && (
                    <span className="text-red-600 font-medium">System Admin</span>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate mb-1">{user?.email}</p>
                  
                  {/* Company Info */}
                  <div className="flex items-center text-xs text-gray-600 mt-2">
                    <Building className="w-3 h-3 mr-1 shrink-0" />
                    <span className="truncate">
                      {isSystemAdmin ? 'LogiTrack System' : companyName}
                    </span>
                  </div>
                  
                  {/* Role Badge */}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isSystemAdmin 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </button>
                
                <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </button>
                
                {!isSystemAdmin && (
                  <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <Building className="w-4 h-4 mr-3" />
                    Company Settings
                  </button>
                )}
                
                <hr className="my-1 border-gray-200" />
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;