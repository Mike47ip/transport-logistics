'use client'

import { useState } from 'react'
import { X, DollarSign, Save, RefreshCw, CreditCard, Banknote, Smartphone } from 'lucide-react'
import { useSnackbar } from '@/context/SnackbarContext'

export default function RecordPaymentModal({ invoice, onClose, onPaymentRecorded }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: invoice ? (invoice.total - (invoice.paidAmount || 0)).toFixed(2) : '',
    method: 'CASH',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().split('T')[0]
  })

  const { showSuccess, showError } = useSnackbar()

  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: <Smartphone className="w-4 h-4" /> },
    { value: 'CARD', label: 'Card Payment', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'CHEQUE', label: 'Cheque', icon: <Banknote className="w-4 h-4" /> }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? value : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid payment amount')
      return
    }

    if (!formData.method) {
      showError('Please select a payment method')
      return
    }

    if (!formData.paidAt) {
      showError('Please select the payment date')
      return
    }

    try {
      setLoading(true)

      const payload = {
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        amount: parseFloat(formData.amount),
        method: formData.method,
        reference: formData.reference.trim() || null,
        notes: formData.notes.trim() || null,
        paidAt: formData.paidAt
      }

      console.log('Recording payment:', payload)

      const response = await fetch('/api/sales/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const payment = await response.json()
        console.log('Payment recorded successfully:', payment)
        showSuccess('Payment recorded successfully!')
        onPaymentRecorded(payment)
      } else {
        const errorText = await response.text()
        console.error('Payment recording failed:', response.status, errorText)
        
        try {
          const error = JSON.parse(errorText)
          showError(error.error || 'Failed to record payment')
        } catch {
          showError(`Failed to record payment: ${response.status} ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('Payment recording error:', error)
      showError('Network error recording payment')
    } finally {
      setLoading(false)
    }
  }

  const remainingAmount = invoice ? invoice.total - (invoice.paidAmount || 0) : 0
  const isOverpayment = parseFloat(formData.amount) > remainingAmount
  const isPartialPayment = parseFloat(formData.amount) < remainingAmount && parseFloat(formData.amount) > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Invoice: {invoice?.invoiceNumber} - {invoice?.client?.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Invoice Total:</span>
              <span className="font-semibold">GH₵ {invoice?.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Already Paid:</span>
              <span className="text-green-600">GH₵ {(invoice?.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-300 pt-2">
              <span className="text-sm font-medium text-gray-900">Amount Due:</span>
              <span className="font-bold text-red-600">GH₵ {remainingAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount *
            </label>
            <div className="relative">
              <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {isOverpayment && (
              <p className="text-orange-600 text-sm mt-1">
                Warning: This payment exceeds the amount due
              </p>
            )}
            {isPartialPayment && (
              <p className="text-blue-600 text-sm mt-1">
                This will be a partial payment. Remaining: GH₵ {(remainingAmount - parseFloat(formData.amount)).toFixed(2)}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Number
              <span className="text-gray-500 text-xs ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleInputChange}
              placeholder="Transaction reference, check number, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Payment Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              name="paidAt"
              value={formData.paidAt}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
              <span className="text-gray-500 text-xs ml-1">(Optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional payment notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Footer */}
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}