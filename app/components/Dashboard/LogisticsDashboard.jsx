import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import DashboardLayout from '@/components/Layout/DashboardLayout';

const LogisticsDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeDeliveries: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    vehicleStats: {},
    recentDeliveries: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const DeliveryStatusBadge = ({ status }) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your fleet.</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                New Delivery
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Vehicles"
            value={stats.totalVehicles}
            icon={Truck}
            color="bg-blue-500"
            change="+2 this month"
          />
          <StatCard
            title="Active Deliveries"
            value={stats.activeDeliveries}
            icon={Package}
            color="bg-green-500"
            change="+12% vs last month"
          />
          <StatCard
            title="Total Clients"
            value={stats.totalClients}
            icon={Users}
            color="bg-purple-500"
            change="+5 new clients"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue?.toLocaleString() || 0}`}
            icon={DollarSign}
            color="bg-orange-500"
            change="+8% vs last month"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vehicle Status Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Vehicle Fleet Status</h2>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(stats.vehicleStats || {}).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
                
                {/* Quick Actions */}
                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 flex items-center justify-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </button>
                  <button className="flex-1 bg-orange-50 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Maintenance
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {(stats.recentDeliveries || []).length > 0 ? (
                  stats.recentDeliveries.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{delivery.client?.name}</p>
                        <p className="text-sm text-gray-600 truncate">{delivery.deliveryAddress}</p>
                        <div className="mt-1">
                          <DeliveryStatusBadge status={delivery.status} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{delivery.vehicle?.licensePlate}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(delivery.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent deliveries</p>
                  </div>
                )}
              </div>
              
              <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium py-2">
                View All Deliveries
              </button>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Vehicle Maintenance Due</p>
                  <p className="text-xs text-yellow-700">2 vehicles require scheduled maintenance this week</p>
                </div>
                <button className="text-yellow-600 hover:text-yellow-700 text-sm">View</button>
              </div>
              
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Delivery Updates</p>
                  <p className="text-xs text-blue-700">3 deliveries are running behind schedule</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LogisticsDashboard;