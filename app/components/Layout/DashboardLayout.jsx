'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        user={user} 
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={closeMobileSidebar}
      />
      
      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} ml-0`}>
        {/* Top Navbar */}
        <Navbar 
          user={user} 
          onMobileMenuToggle={toggleMobileSidebar}
          isCollapsed={isCollapsed}
        />
        
        {/* Page Content */}
        <main className="pt-16">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;