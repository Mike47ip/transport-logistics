'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, TrendingUp, Package, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Filter, Download,
  Eye, Edit, Trash2, Plus, Search, MoreHorizontal
} from 'lucide-react'

export default function SalesRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('this-month')
  const [filters, setFilters] = useState({
    status: 'all',
    client: 'all',
    paymentStatus: 'all'
  })

  useEffect(() => {
    fetchSalesData()
  }, [dateRange, filters])

  const fetchSalesData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const [salesRes, invoicesRes, paymentsRes] = await Promise.all([
        fetch(`/api/sales/dashboard?range=${dateRange}`, { headers }),
        fetch(`/api/sales/invoices?${new URLSearchParams(filters)}`, { headers }),
        fetch('/api/sales/payments', { headers })
      ])

      if (salesRes.ok) {
        const data = await salesRes.json()
        setSalesData(data)
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setInvoices(data)
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(salesData?.totalRevenue),
      change: salesData?.revenueChange,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-blue-600'
    },
    {
      title: 'Completed Deliveries',
      value: salesData?.completedDeliveries || 0,
      change: salesData?.deliveriesChange,
      icon: <Package className="w-6 h-6" />,
      color: 'text-green-600'
    },
    {
      title: 'Active Clients',
      value: salesData?.activeClients || 0,
      change: salesData?.clientsChange,
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-600'
    },
    {
      title: 'Pending Payments',
      value: formatCurrency(salesData?.pendingPayments),
      change: salesData?.paymentsChange,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-orange-600'
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'payments', label: 'Payments' },
    { id: 'reports', label: 'Reports' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales & Revenue</h1>
          <p className="text-gray-600 mt-1">Track your business performance and financials</p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-quarter">This Quarter</option>
            <option value="this-year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-gray-50 ${metric.color}`}>
                {metric.icon}
              </div>
              {metric.change && (
                <div className={`flex items-center text-sm ${
                  metric.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              {/* Chart component would go here */}
              <p>Revenue chart visualization</p>
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients</h3>
            <div className="space-y-4">
              {salesData?.topClients?.map((client, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-600">{client.deliveries} deliveries</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(client.revenue)}</p>
                </div>
              )) || (
                <p className="text-gray-500">No client data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Invoices Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  New Invoice
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.client?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{payment.client?.name}</p>
                    <p className="text-sm text-gray-600">{payment.invoiceNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                  <p className="text-sm text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Revenue Report',
              'Client Statement',
              'Delivery Performance',
              'Payment History',
              'Tax Summary',
              'Profit & Loss'
            ].map((report, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{report}</span>
                  <Download className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}