'use client'

import { X, Calendar, DollarSign, Truck, FileText, Receipt, User } from 'lucide-react'

export default function ExpenseDetailsModal({ expense, onClose, categories }) {
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
      month: 'long',
      year: 'numeric'
    })
  }

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, color: '#6B7280' }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const categoryInfo = getCategoryInfo(expense.category)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-pink-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold">Expense Details</h2>
              <p className="text-red-100">{expense.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-100 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* Main Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Vehicle Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">Vehicle Information</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Registration Number:</span>
                  <p className="font-semibold text-gray-900">{expense.vehicle?.registrationNumber}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Make & Model:</span>
                  <p className="font-medium text-gray-900">{expense.vehicle?.make} {expense.vehicle?.model}</p>
                </div>
                {expense.vehicle?.year && (
                  <div>
                    <span className="text-sm text-gray-600">Year:</span>
                    <p className="font-medium text-gray-900">{expense.vehicle.year}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Expense Category */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-medium text-gray-900">Category</h3>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: categoryInfo.color }}
                />
                <span className="font-semibold text-gray-900">{categoryInfo.name}</span>
              </div>
            </div>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Amount</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(expense.amount)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Expense Date</span>
              </div>
              <p className="font-semibold text-gray-900">
                {formatDate(expense.expenseDate)}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-gray-600">Status</span>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                {expense.status}
              </span>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expense.receiptNumber && (
                <div>
                  <span className="text-sm text-gray-600">Receipt Number:</span>
                  <p className="font-medium text-gray-900">{expense.receiptNumber}</p>
                </div>
              )}
              {expense.vendor && (
                <div>
                  <span className="text-sm text-gray-600">Vendor:</span>
                  <p className="font-medium text-gray-900">{expense.vendor}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Created:</span>
                <p className="font-medium text-gray-900">{formatDate(expense.createdAt)}</p>
              </div>
              {expense.updatedAt !== expense.createdAt && (
                <div>
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <p className="font-medium text-gray-900">{formatDate(expense.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{expense.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Expense ID: {expense.id}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}