// app\api\sales\payments\route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 50
    const clientId = searchParams.get('clientId')
    const method = searchParams.get('method')
    const status = searchParams.get('status')

    // Build where clause
    const where = {
      tenantId: user.tenantId
    }

    if (clientId && clientId !== 'all') {
      where.clientId = clientId
    }

    if (method && method !== 'all') {
      where.method = method
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            dueDate: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Add formatted data for easier frontend consumption
    const formattedPayments = payments.map(payment => ({
      ...payment,
      formattedAmount: `GH₵ ${payment.amount.toFixed(2)}`,
      formattedDate: new Date(payment.createdAt).toLocaleDateString(),
      formattedPaidAt: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : null
    }))

    return NextResponse.json(formattedPayments)

  } catch (error) {
    console.error('Payments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const {
      invoiceId,
      clientId,
      amount,
      method,
      reference,
      notes,
      paidAt
    } = data

    console.log('Payment creation data received:', data)

    // Validation
    if (!clientId || !amount || !method) {
      return NextResponse.json(
        { error: 'Client, amount, and payment method are required' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: user.tenantId
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // If invoice is specified, verify it exists and belongs to the client
    if (invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          clientId: clientId,
          tenantId: user.tenantId
        }
      })

      if (!invoice) {
        return NextResponse.json(
          { error: 'Invoice not found or does not belong to the specified client' },
          { status: 404 }
        )
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          tenantId: user.tenantId,
          invoiceId: invoiceId || null,
          clientId,
          amount: parseFloat(amount),
          method,
          reference: reference || null,
          notes: notes || null,
          status: 'PAID',
          paidAt: paidAt ? new Date(paidAt) : new Date()
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              dueDate: true
            }
          }
        }
      })

      // Update invoice if payment is linked to one
      if (invoiceId) {
        // Get all payments for this invoice
        const allPayments = await tx.payment.findMany({
          where: { invoiceId: invoiceId }
        })

        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)
        
        // Get the invoice to compare with total
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId }
        })

        if (invoice) {
          let paymentStatus = 'PARTIAL'
          let invoiceStatus = invoice.status

          if (totalPaid >= invoice.total) {
            paymentStatus = 'PAID'
            invoiceStatus = 'PAID'
          } else if (totalPaid === 0) {
            paymentStatus = 'PENDING'
          }

          await tx.invoice.update({
            where: { id: invoiceId },
            data: {
              paidAmount: totalPaid,
              paymentStatus,
              paidAt: paymentStatus === 'PAID' ? new Date() : invoice.paidAt,
              status: invoiceStatus
            }
          })

          console.log(`Invoice ${invoice.invoiceNumber} updated: ${paymentStatus} (${totalPaid}/${invoice.total})`)
        }
      }

      return newPayment
    })

    console.log('Payment created successfully:', payment.id)
    return NextResponse.json(payment, { status: 201 })

  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: `Failed to create payment: ${error.message}` },
      { status: 500 }
    )
  }
}

// Update payment status (for failed payments, refunds, etc.)
export async function PATCH(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { paymentId, status, notes } = data

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Payment ID and status are required' },
        { status: 400 }
      )
    }

    // Verify payment belongs to tenant
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenantId: user.tenantId
      },
      include: {
        invoice: true
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update payment
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status,
          notes: notes || existingPayment.notes,
          updatedAt: new Date()
        },
        include: {
          client: true,
          invoice: true
        }
      })

      // Recalculate invoice payment status if needed
      if (existingPayment.invoiceId) {
        const allPayments = await tx.payment.findMany({
          where: { 
            invoiceId: existingPayment.invoiceId,
            status: 'PAID' // Only count successful payments
          }
        })

        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)
        const invoice = existingPayment.invoice

        let paymentStatus = 'PENDING'
        let invoiceStatus = 'SENT'

        if (totalPaid >= invoice.total) {
          paymentStatus = 'PAID'
          invoiceStatus = 'PAID'
        } else if (totalPaid > 0) {
          paymentStatus = 'PARTIAL'
        }

        await tx.invoice.update({
          where: { id: existingPayment.invoiceId },
          data: {
            paidAmount: totalPaid,
            paymentStatus,
            status: invoiceStatus,
            paidAt: paymentStatus === 'PAID' ? new Date() : null
          }
        })
      }

      return payment
    })

    return NextResponse.json(updatedPayment)

  } catch (error) {
    console.error('Payment update error:', error)
    return NextResponse.json(
      { error: `Failed to update payment: ${error.message}` },
      { status: 500 }
    )
  }
}