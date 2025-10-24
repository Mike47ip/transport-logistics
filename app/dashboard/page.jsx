'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      console.log('📊 DASHBOARD: Fetching dashboard data...')
      
      const token = localStorage.getItem('token')
      if (!token) {
        setError('No authentication token found')
        return
      }

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 DASHBOARD: Data loaded successfully')
      setDashboardData(data)
    } catch (error) {
      console.error('📊 DASHBOARD: Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      case 'AVAILABLE': return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'OUT_OF_SERVICE': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-700'
      case 'NORMAL': return 'bg-blue-100 text-blue-700'
      case 'HIGH': return 'bg-orange-100 text-orange-700'
      case 'URGENT': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`
  }

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
    )
  }

  if (error) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button 
              onClick={fetchDashboardData} 
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6">No dashboard data available</div>
      </DashboardLayout>
    )
  }

  const { overview, revenue, performance, charts, recentActivity, alerts } = dashboardData

  return (
    <DashboardLayout user={user}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name}! Here's what's happening with your logistics operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Alerts Section */}
        {alerts.notifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Alerts & Notifications</h2>
            <div className="space-y-3">
              {alerts.notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    notification.type === 'warning' 
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <span className="font-medium">{notification.message}</span>
                  <button className="text-sm underline hover:no-underline">
                    {notification.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Deliveries */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{overview.totalDeliveries}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {overview.deliveriesToday} today • {overview.deliveriesThisWeek} this week
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500">
                <span className="text-white text-2xl">📦</span>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(revenue.totalRevenue)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg: {formatCurrency(revenue.averageOrderValue)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500">
                <span className="text-white text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Fleet Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Status</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{overview.totalVehicles}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {charts.vehicleStatus.find(v => v.status === 'AVAILABLE')?.count || 0} available
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500">
                <span className="text-white text-2xl">🚛</span>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatPercentage(performance.completionRate)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Avg time: {performance.averageDeliveryTime}h
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500">
                <span className="text-white text-2xl">📊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Status Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status Distribution</h3>
            <div className="space-y-4">
              {charts.deliveryStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}></div>
                    <span className="text-sm font-medium">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
            <div className="space-y-4">
              {charts.priority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Delivery Activity (Last 30 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {charts.dailyDeliveries.slice(0, 30).reverse().map((day, index) => {
              const maxHeight = Math.max(...charts.dailyDeliveries.map(d => d.total))
              const height = (day.total / maxHeight) * 100
              const deliveredHeight = (day.delivered / maxHeight) * 100
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full bg-gray-200 rounded-t" style={{ height: '200px' }}>
                    <div 
                      className="absolute bottom-0 w-full bg-blue-400 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div 
                      className="absolute bottom-0 w-full bg-green-500 rounded-t"
                      style={{ height: `${deliveredHeight}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 transform rotate-45 origin-top-left">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="hidden group-hover:block absolute bg-black text-white p-2 rounded text-xs mt-8 z-10">
                    {day.date}: {day.total} total, {day.delivered} delivered
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span className="text-sm text-gray-600">Total Deliveries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
          </div>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deliveries */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Deliveries</h3>
              <a href="/deliveries" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all →
              </a>
            </div>
            <div className="space-y-3">
              {recentActivity.recentDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-blue-600">
                        {delivery.trackingNumber}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {delivery.client} • {delivery.driver}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Clients (30 days)</h3>
              <a href="/customers" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all →
              </a>
            </div>
            <div className="space-y-3">
              {charts.topClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{client.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{client.deliveries} deliveries</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/deliveries"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">📦</span>
              <span className="text-sm font-medium text-gray-900">New Delivery</span>
            </a>
            <a
              href="/vehicles"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">🚛</span>
              <span className="text-sm font-medium text-gray-900">Fleet Status</span>
            </a>
            <a
              href="/drivers"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">👥</span>
              <span className="text-sm font-medium text-gray-900">Drivers</span>
            </a>
            <a
              href="/customers"
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mb-2">🏢</span>
              <span className="text-sm font-medium text-gray-900">Customers</span>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}