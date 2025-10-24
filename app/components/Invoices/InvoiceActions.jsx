'use client'

import { useState } from 'react'
import { 
  Printer, Download, Mail, Share2, Eye, ExternalLink,
  Copy, Check, FileText, Send
} from 'lucide-react'
import { useSnackbar } from '@/context/SnackbarContext'
import { 
  printInvoice, 
  downloadInvoiceHTML, 
  shareInvoice, 
  emailInvoice,
  generateInvoiceHTML 
} from '@/utils/invoiceGenerator'

export default function InvoiceActions({ invoice, className = '' }) {
  const [loading, setLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({
    recipientEmail: invoice?.client?.email || '',
    subject: `Invoice ${invoice?.invoiceNumber} from LogiTrack`,
    message: `Dear ${invoice?.client?.name},\n\nPlease find attached your invoice.\n\nThank you for your business!`
  })

  const { showSuccess, showError } = useSnackbar()

  // Company info - you can make this configurable
  const companyInfo = {
    name: 'LogiTrack Delivery Services',
    address: 'Accra, Ghana',
    phone: '+233 XX XXX XXXX',
    email: 'info@logitrack.com',
    website: 'www.logitrack.com'
  }

  const handlePrint = () => {
    try {
      printInvoice(invoice, companyInfo)
      showSuccess('Invoice sent to printer')
    } catch (error) {
      console.error('Print error:', error)
      showError('Failed to print invoice')
    }
  }

  const handleDownload = () => {
    try {
      downloadInvoiceHTML(invoice, null)
      showSuccess('Invoice downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      showError('Failed to download invoice')
    }
  }

  const handleShare = async () => {
    try {
      await shareInvoice(invoice, companyInfo)
      showSuccess('Invoice shared successfully')
    } catch (error) {
      console.error('Share error:', error)
      showError('Failed to share invoice')
    }
  }

  const handlePreview = () => {
    try {
      const invoiceHTML = generateInvoiceHTML(invoice, companyInfo)
      const previewWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes')
      
      if (previewWindow) {
        previewWindow.document.write(invoiceHTML)
        previewWindow.document.close()
      } else {
        showError('Please allow popups to preview invoice')
      }
    } catch (error) {
      console.error('Preview error:', error)
      showError('Failed to preview invoice')
    }
  }

  const handleEmail = async () => {
    if (!emailForm.recipientEmail) {
      showError('Please enter recipient email')
      return
    }

    try {
      setLoading(true)
      const result = await emailInvoice(invoice, emailForm.recipientEmail, companyInfo)
      
      if (result.success) {
        showSuccess(result.message)
        setShowEmailModal(false)
      } else {
        showError(result.message)
      }
    } catch (error) {
      console.error('Email error:', error)
      showError('Failed to send invoice via email')
    } finally {
      setLoading(false)
    }
  }

  const copyInvoiceLink = async () => {
    try {
      const invoiceURL = `${window.location.origin}/invoices/${invoice.id}`
      await navigator.clipboard.writeText(invoiceURL)
      showSuccess('Invoice link copied to clipboard')
    } catch (error) {
      showError('Failed to copy link')
    }
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Preview Button */}
        <button
          onClick={handlePreview}
          className="flex items-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          title="Preview Invoice"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Preview</span>
        </button>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1 px-3 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          title="Print Invoice"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Print</span>
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-3 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
          title="Download Invoice"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </button>

        {/* Email Button */}
        <button
          onClick={() => setShowEmailModal(true)}
          className="flex items-center gap-1 px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
          title="Email Invoice"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">Email</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-3 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
          title="Share Invoice"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Copy Link Button */}
        <button
          onClick={copyInvoiceLink}
          className="flex items-center gap-1 px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
          title="Copy Invoice Link"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Email Invoice</h3>
              </div>
              <button 
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={emailForm.recipientEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmail}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {loading ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Compact version for table rows
export function InvoiceActionsCompact({ invoice, className = '' }) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowActions(!showActions)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        title="Invoice Actions"
      >
        <FileText className="w-4 h-4" />
      </button>

      {showActions && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowActions(false)}
          />
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 min-w-[150px]">
            <button
              onClick={() => {
                try {
                  const invoiceHTML = generateInvoiceHTML(invoice, {
                    name: 'LogiTrack Delivery Services',
                    address: 'Accra, Ghana',
                    phone: '+233 XX XXX XXXX',
                    email: 'info@logitrack.com'
                  })
                  const previewWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes')
                  if (previewWindow) {
                    previewWindow.document.write(invoiceHTML)
                    previewWindow.document.close()
                  }
                } catch (error) {
                  console.error('Preview error:', error)
                }
                setShowActions(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            
            <button
              onClick={() => {
                printInvoice(invoice, {
                  name: 'LogiTrack Delivery Services',
                  address: 'Accra, Ghana',
                  phone: '+233 XX XXX XXXX',
                  email: 'info@logitrack.com'
                })
                setShowActions(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            
            <button
              onClick={() => {
                downloadInvoiceHTML(invoice)
                setShowActions(false)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </>
      )}
    </div>
  )
}