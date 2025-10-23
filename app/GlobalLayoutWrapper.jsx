'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';

export default function GlobalLayoutWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Routes that don't need DashboardLayout
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setIsLoading(false);
  }, []);

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // For public routes or unauthenticated users, render without DashboardLayout
  if (isPublicRoute || !user) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    );
  }

  // For authenticated users, wrap with DashboardLayout
  return (
    <DashboardLayout user={user}>
      {children}
    </DashboardLayout>
  );
}