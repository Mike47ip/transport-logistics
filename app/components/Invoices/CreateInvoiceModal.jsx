// app\components\Invoices\CreateInvoiceModal.jsx

'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, RefreshCw, Calculator } from 'lucide-react'
import { useSnackbar } from '@/context/SnackbarContext'

export default function CreateInvoiceModal({ onClose, onInvoiceCreated }) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    notes: '',
    taxRate: 0,
    discountAmount: 0
  })
  const [selectedDeliveries, setSelectedDeliveries] = useState([])
  const [customItems, setCustomItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 }
  ])
  const [invoiceType, setInvoiceType] = useState('delivery') // 'delivery' or 'custom'
  const [validationErrors, setValidationErrors] = useState({
    clientId: false,
    dueDate: false,
    deliveries: false,
    items: false
  })

  const { showSuccess, showError } = useSnackbar()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (formData.clientId) {
      fetchClientDeliveries(formData.clientId)
    }
  }, [formData.clientId])

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const clientsRes = await fetch('/api/clients', { headers })
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchClientDeliveries = async (clientId) => {
    try {
      const token = localStorage.getItem('token')
      const headers = { 'Authorization': `Bearer ${token}` }

      const deliveriesRes = await fetch(`/api/deliveries?clientId=${clientId}&status=DELIVERED&invoiced=false`, { headers })
      if (deliveriesRes.ok) {
        const deliveriesData = await deliveriesRes.json()
        setDeliveries(deliveriesData)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'taxRate' || name === 'discountAmount' ? parseFloat(value) || 0 : value
    }))

    // Clear validation error when field is filled
    if (validationErrors[name] && value.trim() !== '') {
      setValidationErrors(prev => ({
        ...prev,
        [name]: false
      }))
    }
  }

  const handleDeliveryToggle = (deliveryId) => {
    setSelectedDeliveries(prev => {
      const newSelection = prev.includes(deliveryId)
        ? prev.filter(id => id !== deliveryId)
        : [...prev, deliveryId]
      
      // Clear validation error if deliveries are selected
      if (validationErrors.deliveries && newSelection.length > 0) {
        setValidationErrors(prev => ({
          ...prev,
          deliveries: false
        }))
      }
      
      return newSelection
    })
  }

  const handleCustomItemChange = (index, field, value) => {
    setCustomItems(prev => {
      const updatedItems = prev.map((item, i) => 
        i === index 
          ? { ...item, [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value }
          : item
      )
      
      // Clear validation error if at least one item has description
      if (validationErrors.items && updatedItems.some(item => item.description.trim() !== '')) {
        setValidationErrors(prevErrors => ({
          ...prevErrors,
          items: false
        }))
      }
      
      return updatedItems
    })
  }

  const addCustomItem = () => {
    setCustomItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }])
  }

  const removeCustomItem = (index) => {
    if (customItems.length > 1) {
      setCustomItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const calculateTotals = () => {
    let subtotal = 0

    if (invoiceType === 'delivery') {
      // Calculate from selected deliveries
      const selectedDeliveryData = deliveries.filter(d => selectedDeliveries.includes(d.id))
      subtotal = selectedDeliveryData.reduce((sum, delivery) => {
        return sum + (delivery.actualPrice || delivery.estimatedPrice || 0)
      }, 0)
    } else {
      // Calculate from custom items
      subtotal = customItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)
    }

    const taxAmount = subtotal * (formData.taxRate / 100)
    const total = subtotal + taxAmount - formData.discountAmount

    return { subtotal, taxAmount, total }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Reset validation errors
    let errors = {
      clientId: false,
      dueDate: false,
      deliveries: false,
      items: false
    }

    // Validate required fields
    if (!formData.clientId) {
      errors.clientId = true
    }
    
    if (!formData.dueDate) {
      errors.dueDate = true
    }

    if (invoiceType === 'delivery' && selectedDeliveries.length === 0) {
      errors.deliveries = true
    }

    if (invoiceType === 'custom' && customItems.every(item => !item.description.trim())) {
      errors.items = true
    }

    // Set validation errors
    setValidationErrors(errors)

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error)
    
    if (hasErrors) {
      showError('Please fill in all required fields highlighted in red')
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        clientId: formData.clientId,
        dueDate: formData.dueDate,
        notes: formData.notes,
        taxRate: formData.taxRate,
        discountAmount: formData.discountAmount,
        deliveryIds: invoiceType === 'delivery' ? selectedDeliveries : [],
        items: invoiceType === 'custom' 
          ? customItems.filter(item => item.description.trim() !== '')
          : deliveries
              .filter(d => selectedDeliveries.includes(d.id))
              .map(d => ({
                description: `Delivery Service - ${d.trackingNumber} (${d.pickupAddress} → ${d.deliveryAddress})`,
                quantity: 1,
                unitPrice: d.actualPrice || d.estimatedPrice || 0
              }))
      }

      console.log('Creating invoice with payload:', payload)

      const response = await fetch('/api/sales/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })

      console.log('Invoice API response status:', response.status)

      if (response.ok) {
        const newInvoice = await response.json()
        console.log('Invoice created successfully:', newInvoice)
        showSuccess('Invoice created successfully!')
        onInvoiceCreated(newInvoice)
        onClose()
      } else {
        const errorText = await response.text()
        console.error('Invoice creation failed:', response.status, errorText)
        
        try {
          const error = JSON.parse(errorText)
          showError(error.message || 'Failed to create invoice')
        } catch {
          showError(`Failed to create invoice: ${response.status} ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('Invoice creation error:', error)
      showError('Network error creating invoice')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, total } = calculateTotals()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
                {validationErrors.clientId && (
                  <span className="text-red-500 ml-1">(Required)</span>
                )}
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.clientId 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
              {validationErrors.clientId && (
                <p className="text-red-500 text-sm mt-1">Please select a client</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
                {validationErrors.dueDate && (
                  <span className="text-red-500 ml-1">(Required)</span>
                )}
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.dueDate 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300'
                }`}
              />
              {validationErrors.dueDate && (
                <p className="text-red-500 text-sm mt-1">Please select a due date</p>
              )}
            </div>
          </div>

          {/* Invoice Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Invoice Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="invoiceType"
                  value="delivery"
                  checked={invoiceType === 'delivery'}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-900">Bill for Deliveries</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="invoiceType"
                  value="custom"
                  checked={invoiceType === 'custom'}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-900">Custom Invoice</span>
              </label>
            </div>
          </div>

          {/* Delivery Selection */}
          {invoiceType === 'delivery' && formData.clientId && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Select Deliveries to Invoice *
                {validationErrors.deliveries && (
                  <span className="text-red-500 ml-1">(Required)</span>
                )}
              </h3>
              {deliveries.length > 0 ? (
                <div className={`border rounded-md max-h-60 overflow-y-auto ${
                  validationErrors.deliveries 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200'
                }`}>
                  {deliveries.map(delivery => (
                    <div key={delivery.id} className="flex items-center p-3 border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedDeliveries.includes(delivery.id)}
                        onChange={() => handleDeliveryToggle(delivery.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{delivery.trackingNumber}</p>
                            <p className="text-sm text-gray-600">{delivery.pickupAddress} → {delivery.deliveryAddress}</p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            GH₵ {(delivery.actualPrice || delivery.estimatedPrice || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No uninvoiced deliveries found for this client</p>
              )}
              {validationErrors.deliveries && (
                <p className="text-red-500 text-sm mt-1">Please select at least one delivery</p>
              )}
            </div>
          )}

          {/* Custom Items */}
          {invoiceType === 'custom' && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">
                  Invoice Items *
                  {validationErrors.items && (
                    <span className="text-red-500 ml-1">(Required)</span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
              
              <div className={`space-y-3 ${validationErrors.items ? 'p-3 border border-red-500 bg-red-50 rounded-md' : ''}`}>
                {customItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleCustomItemChange(index, 'description', e.target.value)}
                        placeholder="Service description"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          validationErrors.items && !item.description.trim()
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleCustomItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleCustomItemChange(index, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <p className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-right">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeCustomItem(index)}
                        disabled={customItems.length === 1}
                        className="p-2 text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {validationErrors.items && (
                <p className="text-red-500 text-sm mt-1">Please add at least one invoice item with a description</p>
              )}
            </div>
          )}

          {/* Tax and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Amount (GH₵)
              </label>
              <input
                type="number"
                name="discountAmount"
                value={formData.discountAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional notes or payment instructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Invoice Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Invoice Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-900">
                <span>Subtotal:</span>
                <span className="font-medium">GH₵ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-900">
                <span>Tax ({formData.taxRate}%):</span>
                <span className="font-medium">GH₵ {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-900">
                <span>Discount:</span>
                <span className="font-medium">-GH₵ {formData.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-blue-300 pt-2 mt-2">
                <span>Total:</span>
                <span className="text-blue-600">GH₵ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}