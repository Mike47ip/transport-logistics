'use client'

import { useState } from 'react'
import { X, Save, Calendar, DollarSign, Truck, FileText } from 'lucide-react'

export default function CreateExpenseModal({ onClose, onExpenseCreated, vehicles, categories }) {
  const [formData, setFormData] = useState({
    vehicleId: '',
    category: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
    receiptNumber: '',
    vendor: '',
    status: 'PENDING'
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.vehicleId) newErrors.vehicleId = 'Vehicle is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required'
    }
    if (!formData.expenseDate) newErrors.expenseDate = 'Date is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })

      if (response.ok) {
        const newExpense = await response.json()
        onExpenseCreated(newExpense)
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create expense')
      }
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Failed to create expense: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.name : categoryId
  }

  const getSelectedVehicle = () => {
    return vehicles.find(vehicle => vehicle.id === formData.vehicleId)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Vehicle Expense</h2>
              <p className="text-sm text-gray-600">Record a new expense for your vehicle</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Vehicle *
                </label>
                <select
                  name="vehicleId"
                  value={formData.vehicleId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.vehicleId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select vehicle...</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
                {errors.vehicleId && (
                  <p className="text-red-500 text-xs mt-1">{errors.vehicleId}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g., Annual vehicle registration renewal"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Amount (GH₵) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Expense Date *
                </label>
                <input
                  type="date"
                  name="expenseDate"
                  value={formData.expenseDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.expenseDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.expenseDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.expenseDate}</p>
                )}
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Number
                </label>
                <input
                  type="text"
                  name="receiptNumber"
                  value={formData.receiptNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., RCT-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor/Service Provider
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="e.g., DVLA, Insurance Company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Additional notes about this expense..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Preview */}
            {formData.vehicleId && formData.category && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Expense Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Vehicle:</span>
                    <p className="font-medium">{getSelectedVehicle()?.registrationNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{getCategoryName(formData.category)}</p>
                  </div>
                  {formData.amount && (
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-medium text-red-600">GH₵ {parseFloat(formData.amount || 0).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}