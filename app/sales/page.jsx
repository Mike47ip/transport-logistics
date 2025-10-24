'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, TrendingUp, Package, Users, Calendar,
  ArrowUpRight, ArrowDownRight, Filter, Download,
  Eye, Edit, Trash2, Plus, Search, MoreHorizontal
} from 'lucide-react'
import CreateInvoiceModal from '@/components/Invoices/CreateInvoiceModal'
import RecordPaymentModal from '@/components/Invoices/RecordPaymentModal'
import InvoiceDetailsModal from '@/components/Invoices/InvoiceDetailsModal'
import { InvoiceActionsCompact } from '@/components/Invoices/InvoiceActions'

export default function SalesRevenuePage() {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState('this-month')
  const [showCreateInvoice, setShowCreateInvoice] = useState(false)
  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false)
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

  const handleInvoiceCreated = (newInvoice) => {
    setInvoices(prev => [newInvoice, ...prev])
    fetchSalesData() // Refresh dashboard data
  }

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setShowInvoiceDetails(true)
  }

  const handleRecordPayment = (invoice) => {
    setSelectedInvoice(invoice)
    setShowRecordPayment(true)
  }

  const handleEditInvoice = (invoice) => {
    // TODO: Implement edit functionality
    console.log('Edit invoice:', invoice.id)
  }

  const handleDeleteInvoice = (invoice) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      // TODO: Implement delete functionality
      console.log('Delete invoice:', invoice.id)
    }
  }

  const handlePaymentRecorded = (payment) => {
    // Refresh the invoices list to show updated payment status
    fetchSalesData()
    setShowRecordPayment(false)
    setSelectedInvoice(null)
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
      // Invoice statuses
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PARTIAL': 'bg-blue-100 text-blue-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SENT': 'bg-blue-100 text-blue-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      // Payment statuses
      'FAILED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-orange-100 text-orange-800'
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            style={{ color: '#111827' }}
          >
            <option value="today" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Today</option>
            <option value="this-week" style={{ color: '#111827', backgroundColor: '#ffffff' }}>This Week</option>
            <option value="this-month" style={{ color: '#111827', backgroundColor: '#ffffff' }}>This Month</option>
            <option value="last-month" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Last Month</option>
            <option value="this-quarter" style={{ color: '#111827', backgroundColor: '#ffffff' }}>This Quarter</option>
            <option value="this-year" style={{ color: '#111827', backgroundColor: '#ffffff' }}>This Year</option>
            <option value="custom" style={{ color: '#111827', backgroundColor: '#ffffff' }}>Custom Range</option>
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
                <button 
                  onClick={() => setShowCreateInvoice(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
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
                    Payment Status
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
                      <div className="text-sm text-gray-500">
                        {invoice.deliveries?.length > 0 && `${invoice.deliveries.length} deliveries`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.client?.name}</div>
                      <div className="text-sm text-gray-500">{invoice.client?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </div>
                      {invoice.paidAmount > 0 && (
                        <div className="text-sm text-green-600">
                          {formatCurrency(invoice.paidAmount)} paid
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.paymentStatus)}`}>
                          {invoice.paymentStatus}
                        </span>
                        {invoice.paymentStatus === 'PENDING' && new Date(invoice.dueDate) < new Date() && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                      {new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== 'PAID' && (
                        <div className="text-sm text-red-600">
                          {Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <InvoiceActionsCompact invoice={invoice} />
                        <button 
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Invoice Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {invoice.paymentStatus !== 'PAID' && (
                          <button 
                            onClick={() => handleRecordPayment(invoice)}
                            className="text-green-600 hover:text-green-900"
                            title="Record Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEditInvoice(invoice)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Invoice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvoice(invoice)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Invoice"
                        >
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Payments Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  <option value="all">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="divide-y divide-gray-200">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{payment.client?.name}</p>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {payment.method.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          {payment.invoice && (
                            <p className="text-sm text-gray-600">
                              Invoice: {payment.invoice.invoiceNumber}
                            </p>
                          )}
                          {payment.reference && (
                            <p className="text-sm text-gray-600">
                              Ref: {payment.reference}
                            </p>
                          )}
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-lg">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                        payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Details Expansion */}
                  {payment.invoice && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Invoice Total:</span>
                          <p className="font-medium">{formatCurrency(payment.invoice.total)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Due Date:</span>
                          <p className={`font-medium ${
                            new Date(payment.invoice.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {new Date(payment.invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Payment Status:</span>
                          <p className="font-medium">
                            {payment.invoice.paymentStatus === 'PAID' ? 'Fully Paid' :
                             payment.invoice.paymentStatus === 'PARTIAL' ? 'Partially Paid' :
                             'Pending Payment'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
                <p className="text-gray-600">Payment history will appear here once you start recording payments.</p>
              </div>
            )}
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
      
      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <CreateInvoiceModal
          onClose={() => setShowCreateInvoice(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}

      {/* Record Payment Modal */}
      {showRecordPayment && selectedInvoice && (
        <RecordPaymentModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowRecordPayment(false)
            setSelectedInvoice(null)
          }}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}

      {/* Invoice Details Modal */}
      {showInvoiceDetails && selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowInvoiceDetails(false)
            setSelectedInvoice(null)
          }}
          onPaymentRecord={(invoice) => {
            setSelectedInvoice(invoice)
            setShowInvoiceDetails(false)
            setShowRecordPayment(true)
          }}
        />
      )}
    </div>
  )
}