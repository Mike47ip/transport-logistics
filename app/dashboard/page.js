// app/dashboard/page.js
'use client';
import { useEffect, useState } from 'react';
import LogisticsDashboard from '@/components/Dashboard/LogisticsDashboard';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return <LogisticsDashboard user={user} />;
}