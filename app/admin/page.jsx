'use client';
import AdminMainContainer from '@/components/Admin/AdminMainContainer';

export default function AdminPage() {
  // Auth is handled by AuthWrapper - no need to check here
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  return <AdminMainContainer user={user} />;
}