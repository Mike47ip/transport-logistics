'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthWrapper = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Define which routes don't need authentication
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    console.log('🔍 AUTH WRAPPER: Checking auth for path:', pathname);
    
    // Skip auth check for public routes
    if (isPublicRoute) {
      console.log('✅ AUTH WRAPPER: Public route, allowing access');
      setIsLoading(false);
      return;
    }

    // Check authentication for protected routes
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('🎫 AUTH WRAPPER: Token exists:', !!token);
    console.log('👤 AUTH WRAPPER: User data exists:', !!userData);

    if (!token || !userData) {
      console.log('❌ AUTH WRAPPER: No auth data, redirecting to login');
      router.replace('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('👤 AUTH WRAPPER: User role:', parsedUser.role);
      console.log('📍 AUTH WRAPPER: Current path:', pathname);

      // Check role-based access
      if (pathname.startsWith('/admin') && parsedUser.role !== 'SUPER_ADMIN') {
        console.log('🚫 AUTH WRAPPER: Not super admin, blocking admin access');
        router.replace('/dashboard');
        return;
      }

      if (pathname.startsWith('/dashboard') && parsedUser.role === 'SUPER_ADMIN') {
        console.log('🔄 AUTH WRAPPER: Super admin accessing dashboard, redirecting to admin');
        router.replace('/admin');
        return;
      }

      console.log('✅ AUTH WRAPPER: Authentication successful');
      setUser(parsedUser);
      setIsAuthenticated(true);
      setIsLoading(false);

    } catch (error) {
      console.error('💥 AUTH WRAPPER: Error parsing user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/login');
    }
  }, [pathname, router, isPublicRoute]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // For public routes, render directly
  if (isPublicRoute) {
    return children;
  }

  // For protected routes, only render if authenticated
  if (isAuthenticated) {
    return children;
  }

  // Fallback - should not reach here due to redirects above
  return null;
};

export default AuthWrapper;