'use client';
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar user={user} />
      
      {/* Main Content Area */}
      <div className="ml-64">
        {/* Top Navbar */}
        <Navbar 
          user={user} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        {/* Page Content */}
        <main className="pt-16">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;