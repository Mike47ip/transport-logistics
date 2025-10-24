// app/api/sales/invoices/email/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateInvoiceHTML } from '@/utils/invoiceGenerator'
import nodemailer from 'nodemailer'

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { invoiceId, recipientEmail, companyInfo, subject, message } = data

    console.log('Email invoice request:', { invoiceId, recipientEmail })

    // Validate environment
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error('Gmail credentials not found in environment variables')
      return NextResponse.json(
        { error: 'Email service not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    // Fetch invoice data
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: user.tenantId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            paymentTerms: true
          }
        },
        items: { 
          orderBy: { createdAt: 'asc' } 
        },
        deliveries: {
          select: {
            id: true,
            trackingNumber: true,
            pickupAddress: true,
            deliveryAddress: true,
            cargoDescription: true,
            status: true,
            actualPrice: true,
            estimatedPrice: true,
            deliveredAt: true
          }
        },
        payments: { 
          select: {
            id: true,
            amount: true,
            method: true,
            reference: true,
            status: true,
            paidAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' } 
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(invoice, companyInfo)

    // Setup Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    })

    // Email content
    const emailSubject = subject || `Invoice ${invoice.invoiceNumber} from ${companyInfo.name || 'LogiTrack Delivery Services'}`
    const emailMessage = message || `
Dear ${invoice.client.name},

Please find attached your invoice for delivery services.

Invoice Details:
• Invoice Number: ${invoice.invoiceNumber}
• Amount Due: GH₵ ${invoice.total.toFixed(2)}
• Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

Thank you for choosing our delivery services!

Best regards,
${companyInfo.name || 'LogiTrack Delivery Services'}
    `.trim()

    // Send email
    const mailOptions = {
      from: `"${companyInfo.name || 'LogiTrack'}" <${process.env.GMAIL_USER}>`,
      to: recipientEmail,
      subject: emailSubject,
      text: emailMessage,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">${companyInfo.name || 'LogiTrack Delivery Services'}</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Invoice Delivery</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
            <div style="white-space: pre-line; line-height: 1.6; color: #333; margin-bottom: 20px;">
              ${emailMessage}
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6; margin-bottom: 20px;">
              <h3 style="color: #495057; margin: 0 0 10px 0;">Quick Invoice Summary:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #6c757d;">Invoice Number:</td>
                  <td style="padding: 5px 0; font-weight: bold; text-align: right;">${invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6c757d;">Amount:</td>
                  <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #28a745;">GH₵ ${invoice.total.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6c757d;">Due Date:</td>
                  <td style="padding: 5px 0; font-weight: bold; text-align: right;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
                </tr>
                ${invoice.paidAmount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; color: #6c757d;">Amount Paid:</td>
                  <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #17a2b8;">GH₵ ${invoice.paidAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6c757d;">Balance Due:</td>
                  <td style="padding: 5px 0; font-weight: bold; text-align: right; color: #dc3545;">GH₵ ${(invoice.total - invoice.paidAmount).toFixed(2)}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <div style="text-align: center;">
              <p style="color: #6c757d; font-size: 14px; margin: 10px 0;">
                📄 Detailed invoice attached as HTML file
              </p>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 6px; border-left: 4px solid #007bff;">
            <p style="margin: 0; color: #0056b3; font-size: 14px;">
              <strong>💡 Tip:</strong> Save the attached HTML file and open it in your browser for a print-ready invoice.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.html`,
          content: invoiceHTML,
          contentType: 'text/html'
        }
      ]
    }

    try {
      const result = await transporter.sendMail(mailOptions)
      
      console.log('✅ Email sent successfully:', {
        messageId: result.messageId,
        to: recipientEmail,
        subject: emailSubject
      })

      return NextResponse.json({
        success: true,
        message: 'Invoice email sent successfully!',
        messageId: result.messageId,
        invoiceNumber: invoice.invoiceNumber,
        recipientEmail
      })

    } catch (emailError) {
      console.error('Gmail sending failed:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email. Please check email configuration.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Email invoice error:', error)
    return NextResponse.json(
      { error: 'Failed to process email request' },
      { status: 500 }
    )
  }
}