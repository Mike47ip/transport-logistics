// utils/invoiceGenerator.js

export const generateInvoiceHTML = (invoice, companyInfo) => {
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

  const getPaymentStatusBadge = (status) => {
    const styles = {
      'PAID': 'background: #10B981; color: white;',
      'PENDING': 'background: #F59E0B; color: white;',
      'PARTIAL': 'background: #3B82F6; color: white;',
      'OVERDUE': 'background: #EF4444; color: white;'
    }
    return `<span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; ${styles[status] || styles.PENDING}">${status}</span>`
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f8f9fa;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 20px auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .invoice-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          position: relative;
        }
        
        .invoice-header::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" opacity="0.1"><path d="M20 8l-8 5-8-5V6l8 5 8-5v2z"/><path d="M4 4h16v16H4z" fill="none" stroke="white" stroke-width="1"/></svg>') no-repeat center;
          background-size: 60px;
        }
        
        .company-info h1 {
          font-size: 28px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        
        .company-info p {
          opacity: 0.9;
          margin-bottom: 4px;
        }
        
        .invoice-title {
          text-align: right;
          margin-top: -60px;
        }
        
        .invoice-title h2 {
          font-size: 36px;
          font-weight: 300;
          margin-bottom: 8px;
        }
        
        .invoice-number {
          font-size: 18px;
          opacity: 0.9;
        }
        
        .invoice-body {
          padding: 30px;
        }
        
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .bill-to, .invoice-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        
        .bill-to h3, .invoice-info h3 {
          color: #667eea;
          margin-bottom: 12px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .bill-to p, .invoice-info p {
          margin-bottom: 6px;
          font-size: 14px;
        }
        
        .status-badge {
          display: inline-block;
          margin-top: 8px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
          background: #667eea;
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .items-table tr:last-child td {
          border-bottom: none;
        }
        
        .items-table tr:hover {
          background: #f8f9fa;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals-section {
          max-width: 400px;
          margin-left: auto;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
        }
        
        .totals-row.total {
          border-top: 2px solid #667eea;
          font-weight: bold;
          font-size: 18px;
          color: #667eea;
          padding-top: 15px;
          margin-top: 15px;
        }
        
        .payment-info {
          margin-top: 30px;
          padding: 20px;
          background: #e7f3ff;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
        }
        
        .payment-info h3 {
          color: #1976d2;
          margin-bottom: 10px;
        }
        
        .notes-section {
          margin-top: 30px;
          padding: 20px;
          background: #fff8e1;
          border-radius: 8px;
          border-left: 4px solid #ff9800;
        }
        
        .notes-section h3 {
          color: #f57c00;
          margin-bottom: 10px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e9ecef;
          text-align: center;
          color: #6c757d;
          font-size: 14px;
        }
        
        .delivery-info {
          background: #f0fff4;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .delivery-info h4 {
          color: #155724;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .delivery-item {
          background: white;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          border-left: 3px solid #28a745;
        }
        
        .delivery-item:last-child {
          margin-bottom: 0;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .invoice-container {
            margin: 0;
            box-shadow: none;
            border-radius: 0;
          }
          
          .no-print {
            display: none !important;
          }
        }
        
        @media (max-width: 768px) {
          .invoice-details {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .invoice-title {
            text-align: left;
            margin-top: 20px;
          }
          
          .invoice-title h2 {
            font-size: 28px;
          }
          
          .items-table {
            font-size: 12px;
          }
          
          .items-table th,
          .items-table td {
            padding: 10px 8px;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Invoice Header -->
        <div class="invoice-header">
          <div class="company-info">
            <h1>${companyInfo.name || 'LogiTrack Delivery Services'}</h1>
            <p>${companyInfo.address || 'Accra, Ghana'}</p>
            <p>Phone: ${companyInfo.phone || '+233 XX XXX XXXX'}</p>
            <p>Email: ${companyInfo.email || 'info@logitrack.com'}</p>
            ${companyInfo.website ? `<p>Website: ${companyInfo.website}</p>` : ''}
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
            <div class="invoice-number">#${invoice.invoiceNumber}</div>
          </div>
        </div>

        <!-- Invoice Body -->
        <div class="invoice-body">
          <!-- Invoice Details -->
          <div class="invoice-details">
            <div class="bill-to">
              <h3>Bill To</h3>
              <p><strong>${invoice.client.name}</strong></p>
              ${invoice.client.email ? `<p>${invoice.client.email}</p>` : ''}
              <p>${invoice.client.phone}</p>
              ${invoice.client.address ? `<p>${invoice.client.address}</p>` : ''}
            </div>
            
            <div class="invoice-info">
              <h3>Invoice Details</h3>
              <p><strong>Invoice Date:</strong> ${formatDate(invoice.createdAt)}</p>
              <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
              ${invoice.issuedAt ? `<p><strong>Issued Date:</strong> ${formatDate(invoice.issuedAt)}</p>` : ''}
              <div class="status-badge">
                <strong>Status:</strong> ${getPaymentStatusBadge(invoice.paymentStatus)}
              </div>
            </div>
          </div>

          <!-- Delivery Information -->
          ${invoice.deliveries && invoice.deliveries.length > 0 ? `
            <div class="delivery-info">
              <h4>📦 Delivery Services</h4>
              ${invoice.deliveries.map(delivery => `
                <div class="delivery-item">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>${delivery.trackingNumber}</strong>
                      <p style="font-size: 13px; color: #666; margin: 4px 0;">
                        ${delivery.pickupAddress} → ${delivery.deliveryAddress}
                      </p>
                      ${delivery.cargoDescription ? `<p style="font-size: 13px; color: #666;">${delivery.cargoDescription}</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                      <span style="font-weight: bold; color: #28a745;">
                        ${formatCurrency(delivery.actualPrice || delivery.estimatedPrice || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%;" class="text-center">Quantity</th>
                <th style="width: 15%;" class="text-right">Unit Price</th>
                <th style="width: 20%;" class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${item.description}</div>
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                  <td class="text-right"><strong>${formatCurrency(item.total)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Totals Section -->
          <div class="totals-section">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.taxRate > 0 ? `
              <div class="totals-row">
                <span>Tax (${invoice.taxRate}%):</span>
                <span>${formatCurrency(invoice.taxAmount)}</span>
              </div>
            ` : ''}
            ${invoice.discountAmount > 0 ? `
              <div class="totals-row">
                <span>Discount:</span>
                <span>-${formatCurrency(invoice.discountAmount)}</span>
              </div>
            ` : ''}
            <div class="totals-row total">
              <span>Total Amount:</span>
              <span>${formatCurrency(invoice.total)}</span>
            </div>
            ${(invoice.paidAmount || 0) > 0 ? `
              <div class="totals-row" style="color: #28a745;">
                <span>Amount Paid:</span>
                <span>-${formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div class="totals-row" style="color: #dc3545; font-weight: bold;">
                <span>Balance Due:</span>
                <span>${formatCurrency(invoice.total - (invoice.paidAmount || 0))}</span>
              </div>
            ` : ''}
          </div>

          <!-- Payment Information -->
          <div class="payment-info">
            <h3>💳 Payment Information</h3>
            <p><strong>Payment Terms:</strong> ${invoice.client.paymentTerms || 30} days</p>
            <p><strong>Bank Details:</strong> [Your Bank Account Information]</p>
            <p><strong>Mobile Money:</strong> [Your Mobile Money Details]</p>
            <p>Please include invoice number <strong>${invoice.invoiceNumber}</strong> in your payment reference.</p>
          </div>

          <!-- Notes Section -->
          ${invoice.notes ? `
            <div class="notes-section">
              <h3>📝 Notes</h3>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for choosing ${companyInfo.name || 'LogiTrack Delivery Services'}!</p>
            <p>This is a computer-generated invoice and is valid without signature.</p>
            <p style="margin-top: 10px; font-size: 12px;">
              Generated on ${new Date().toLocaleString()} | Invoice ID: ${invoice.id}
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const printInvoice = (invoice, companyInfo = {}) => {
  const invoiceHTML = generateInvoiceHTML(invoice, companyInfo)
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes')
  
  if (printWindow) {
    printWindow.document.write(invoiceHTML)
    printWindow.document.close()
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  } else {
    // Fallback: download as HTML file
    downloadInvoiceHTML(invoice, invoiceHTML)
  }
}

export const downloadInvoiceHTML = (invoice, htmlContent = null) => {
  const html = htmlContent || generateInvoiceHTML(invoice)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${invoice.invoiceNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export const shareInvoice = async (invoice, companyInfo = {}) => {
  const invoiceHTML = generateInvoiceHTML(invoice, companyInfo)
  
  if (navigator.share) {
    try {
      const blob = new Blob([invoiceHTML], { type: 'text/html' })
      const file = new File([blob], `invoice-${invoice.invoiceNumber}.html`, { type: 'text/html' })
      
      await navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice for ${invoice.client.name} - ${invoice.total} GHS`,
        files: [file]
      })
    } catch (error) {
      console.log('Sharing failed:', error)
      downloadInvoiceHTML(invoice, invoiceHTML)
    }
  } else {
    downloadInvoiceHTML(invoice, invoiceHTML)
  }
}

// Email invoice (requires backend email service)
export const emailInvoice = async (invoice, recipientEmail, companyInfo = {}) => {
  try {
    const response = await fetch('/api/sales/invoices/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        recipientEmail,
        companyInfo
      })
    })

    if (response.ok) {
      return { success: true, message: 'Invoice sent successfully!' }
    } else {
      const error = await response.json()
      return { success: false, message: error.message || 'Failed to send invoice' }
    }
  } catch (error) {
    console.error('Email invoice error:', error)
    return { success: false, message: 'Network error sending invoice' }
  }
}