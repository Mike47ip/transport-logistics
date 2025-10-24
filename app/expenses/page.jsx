'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, TrendingUp, Truck, Calendar, Plus, 
  Filter, Download, Eye, Edit, Trash2, Search,
  PieChart, BarChart3, Receipt, FileText
} from 'lucide-react'
import CreateExpenseModal from './CreateExpenseModal'
import ExpenseDetailsModal from './ExpenseDetailsModal'
import { ExpenseActionsCompact } from './ExpenseActions'
import ExpensePieChart from './ExpensePieChart'

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [expenseData, setExpenseData] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState('all')
  const [dateRange, setDateRange] = useState('this-month')
  const [showCreateExpense, setShowCreateExpense] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [showExpenseDetails, setShowExpenseDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  })

  // Expense categories for vehicle expenses
  const expenseCategories = [
    { id: 'REGISTRATION', name: 'Vehicle Registration', color: '#3B82F6' },
    { id: 'INSURANCE', name: 'Insurance Registration', color: '#10B981' },
    { id: 'ROADWORTHY', name: 'Roadworthy Registration', color: '#F59E0B' },
    { id: 'INCOME_TAX', name: 'Income Tax Registration', color: '#EF4444' },
    { id: 'MAINTENANCE', name: 'Vehicle Maintenance', color: '#8B5CF6' },
    { id: 'FUEL', name: 'Fuel & Gas', color: '#06B6D4' },
    { id: 'OTHER', name: 'Other Expenses', color: '#6B7280' }
  ]

  useEffect(() => {
    fetchExpenseData()
    fetchVehicles()
  }, [dateRange, selectedVehicle])

  const fetchExpenseData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const params = new URLSearchParams({
        range: dateRange,
        vehicleId: selectedVehicle !== 'all' ? selectedVehicle : ''
      })

      const [expenseRes, expensesRes] = await Promise.all([
        fetch(`/api/expenses/dashboard?${params}`, { headers }),
        fetch(`/api/expenses?${params}`, { headers })
      ])

      if (expenseRes.ok) {
        const data = await expenseRes.json()
        setExpenseData(data)
      }

      if (expensesRes.ok) {
        const data = await expensesRes.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expense data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const handleCreateExpense = () => {
    setShowCreateExpense(true)
  }

  const handleExpenseCreated = (newExpense) => {
    setExpenses(prev => [newExpense, ...prev])
    fetchExpenseData() // Refresh dashboard data
  }

  const handleViewExpense = (expense) => {
    setSelectedExpense(expense)
    setShowExpenseDetails(true)
  }

  const handleEditExpense = (expense) => {
    // TODO: Implement edit functionality
    console.log('Edit expense:', expense.id)
  }

  const handleDeleteExpense = (expense) => {
    if (confirm(`Are you sure you want to delete this expense?`)) {
      // TODO: Implement delete functionality
      console.log('Delete expense:', expense.id)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getCategoryColor = (category) => {
    const cat = expenseCategories.find(c => c.id === category)
    return cat ? cat.color : '#6B7280'
  }

  const getCategoryName = (category) => {
    const cat = expenseCategories.find(c => c.id === category)
    return cat ? cat.name : category
  }

  // Filter expenses based on search and filters
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vehicle?.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(expense.category).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filters.category === 'all' || expense.category === filters.category
    const matchesStatus = filters.status === 'all' || expense.status === filters.status
    
    return matchesSearch && matchesCategory && matchesStatus
  })

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
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Expenses</h1>
            <p className="text-gray-600 mt-1">Track and manage vehicle-related expenses</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="this-year">This Year</option>
            </select>
            <button
              onClick={handleCreateExpense}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenseData?.totalExpenses || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600">vs last period</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Registration Fees</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenseData?.registrationExpenses || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Insurance Costs</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenseData?.insuranceExpenses || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Receipt className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
              <p className="text-2xl font-bold text-gray-900">
                {expenseData?.activeVehicles || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <ExpensePieChart 
            data={expenseData?.categoryBreakdown || []}
            categories={expenseCategories}
          />
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Monthly expense trend chart will go here</p>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            <div className="flex items-center gap-3 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Categories</option>
                {expenseCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        {expense.notes && (
                          <p className="text-sm text-gray-500">{expense.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {expense.vehicle?.registrationNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {expense.vehicle?.make} {expense.vehicle?.model}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getCategoryColor(expense.category) }}
                      >
                        {getCategoryName(expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(expense.expenseDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expense.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        expense.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ExpenseActionsCompact
                        expense={expense}
                        onView={handleViewExpense}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteExpense}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filters.category !== 'all' ? 
                        'Try adjusting your search or filter criteria.' :
                        'Start by adding your first vehicle expense.'
                      }
                    </p>
                    <button
                      onClick={handleCreateExpense}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Expense
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateExpense && (
        <CreateExpenseModal
          onClose={() => setShowCreateExpense(false)}
          onExpenseCreated={handleExpenseCreated}
          vehicles={vehicles}
          categories={expenseCategories}
        />
      )}

      {showExpenseDetails && selectedExpense && (
        <ExpenseDetailsModal
          expense={selectedExpense}
          onClose={() => {
            setShowExpenseDetails(false)
            setSelectedExpense(null)
          }}
          categories={expenseCategories}
        />
      )}
    </div>
  )
}