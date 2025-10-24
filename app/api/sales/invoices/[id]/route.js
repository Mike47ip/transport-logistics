// app\api\sales\invoices\[id]\route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId
      },
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
          orderBy: {
            createdAt: 'asc'
          }
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
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Add computed fields
    const invoiceWithComputedFields = {
      ...invoice,
      isOverdue: new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== 'PAID',
      daysOverdue: invoice.paymentStatus !== 'PAID' ? 
        Math.max(0, Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))) : 0,
      remainingAmount: invoice.total - (invoice.paidAmount || 0),
      formattedDates: {
        createdAt: new Date(invoice.createdAt).toLocaleDateString(),
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        issuedAt: invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : null,
        paidAt: invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : null
      }
    }

    return NextResponse.json(invoiceWithComputedFields)

  } catch (error) {
    console.error('Invoice fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Verify invoice belongs to tenant
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId
      }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        client: true,
        items: true,
        deliveries: true,
        payments: true
      }
    })

    return NextResponse.json(updatedInvoice)

  } catch (error) {
    console.error('Invoice update error:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify invoice belongs to tenant
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId
      },
      include: {
        payments: true
      }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if invoice has payments
    if (existingInvoice.payments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete invoice with recorded payments' },
        { status: 400 }
      )
    }

    // Delete invoice (this will cascade delete items due to onDelete: Cascade)
    await prisma.invoice.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })

  } catch (error) {
    console.error('Invoice delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}