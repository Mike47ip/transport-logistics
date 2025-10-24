'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Calendar, User, DollarSign, Package } from 'lucide-react'
import InvoiceActions from './InvoiceActions'

export default function InvoiceDetailsModal({ invoice, onClose, onPaymentRecord }) {
  const [loading, setLoading] = useState(false)
  const [invoiceDetails, setInvoiceDetails] = useState(invoice)

  useEffect(() => {
    if (invoice?.id) {
      fetchInvoiceDetails()
    }
  }, [invoice?.id])

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/invoices/${invoice.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInvoiceDetails(data)
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error)
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      'PAID': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PARTIAL': 'bg-blue-100 text-blue-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'DRAFT': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const remainingAmount = invoiceDetails ? invoiceDetails.total - (invoiceDetails.paidAmount || 0) : 0
  const isOverdue = invoiceDetails && new Date(invoiceDetails.dueDate) < new Date() && invoiceDetails.paymentStatus !== 'PAID'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold">Invoice Details</h2>
              <p className="text-blue-100">{invoiceDetails?.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 flex-1">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 p-6">
              {/* Invoice Actions */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Invoice Actions</h3>
                    <p className="text-sm text-gray-600">Print, download, or share this invoice</p>
                  </div>
                  <InvoiceActions invoice={invoiceDetails} />
                </div>
              </div>

              {/* Invoice Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(invoiceDetails?.total)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Paid Amount</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(invoiceDetails?.paidAmount || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className={`${remainingAmount > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${remainingAmount > 0 ? 'bg-red-600' : 'bg-gray-600'} rounded-lg flex items-center justify-center`}>
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Balance Due</p>
                      <p className={`text-xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(remainingAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Client Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">Bill To</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{invoiceDetails?.client?.name}</p>
                    {invoiceDetails?.client?.email && (
                      <p className="text-sm font-medium text-gray-700">{invoiceDetails.client.email}</p>
                    )}
                    <p className="text-sm font-medium text-gray-700">{invoiceDetails?.client?.phone}</p>
                    {invoiceDetails?.client?.address && (
                      <p className="text-sm font-medium text-gray-700">{invoiceDetails.client.address}</p>
                    )}
                  </div>
                </div>

                {/* Invoice Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">Invoice Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Invoice Date:</span>
                      <span className="text-sm font-semibold text-gray-900">{formatDate(invoiceDetails?.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Due Date:</span>
                      <span className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(invoiceDetails?.dueDate)}
                      </span>
                    </div>
                    {isOverdue && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Days Overdue:</span>
                        <span className="text-sm font-semibold text-red-600">
                          {Math.floor((new Date() - new Date(invoiceDetails.dueDate)) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoiceDetails?.paymentStatus)}`}>
                        {invoiceDetails?.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {invoiceDetails?.deliveries && invoiceDetails.deliveries.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-green-600" />
                    <h3 className="font-medium text-gray-900">Delivery Services</h3>
                  </div>
                  <div className="space-y-3">
                    {invoiceDetails.deliveries.map(delivery => (
                      <div key={delivery.id} className="bg-white border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{delivery.trackingNumber}</p>
                            <p className="text-sm text-gray-600">
                              {delivery.pickupAddress} → {delivery.deliveryAddress}
                            </p>
                            {delivery.cargoDescription && (
                              <p className="text-sm text-gray-500 mt-1">{delivery.cargoDescription}</p>
                            )}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                              delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {delivery.status}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              {formatCurrency(delivery.actualPrice || delivery.estimatedPrice || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice Items */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">Invoice Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoiceDetails?.items?.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.description}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="max-w-sm ml-auto space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-800">Subtotal:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(invoiceDetails?.subtotal)}</span>
                  </div>
                  {invoiceDetails?.taxRate > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">Tax ({invoiceDetails.taxRate}%):</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(invoiceDetails.taxAmount)}</span>
                    </div>
                  )}
                  {invoiceDetails?.discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">Discount:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(invoiceDetails.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-3 mt-3">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">{formatCurrency(invoiceDetails?.total)}</span>
                  </div>
                  {(invoiceDetails?.paidAmount || 0) > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">Amount Paid:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(invoiceDetails?.paidAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold border-t border-gray-300 pt-3">
                        <span className="text-gray-900">Balance Due:</span>
                        <span className="text-red-600">{formatCurrency(remainingAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {invoiceDetails?.notes && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700">{invoiceDetails.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Invoice created on {invoiceDetails && formatDate(invoiceDetails.createdAt)}
                </div>
                <div className="flex items-center gap-3">
                  {invoiceDetails?.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => onPaymentRecord && onPaymentRecord(invoiceDetails)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm font-medium"
                    >
                      <DollarSign className="w-4 h-4" />
                      Record Payment
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}