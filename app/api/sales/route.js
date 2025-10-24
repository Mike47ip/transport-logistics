// app/api/sales/invoices/route.js
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
    const status = searchParams.get('status') || 'all'
    const client = searchParams.get('client') || 'all'
    const paymentStatus = searchParams.get('paymentStatus') || 'all'

    // Build where clause
    const where = {
      tenantId: user.tenantId
    }

    if (status !== 'all') {
      where.status = status
    }

    if (client !== 'all') {
      where.clientId = client
    }

    if (paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        deliveries: {
          select: {
            id: true,
            trackingNumber: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(invoices)

  } catch (error) {
    console.error('Invoices fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
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
      clientId,
      deliveryIds = [],
      items = [],
      dueDate,
      notes,
      taxRate = 0,
      discountAmount = 0
    } = data

    // Generate invoice number
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId: user.tenantId,
        invoiceNumber: {
          startsWith: `INV-${year}${month}`
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    })

    let invoiceNumber
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
      invoiceNumber = `INV-${year}${month}-${String(lastNumber + 1).padStart(4, '0')}`
    } else {
      invoiceNumber = `INV-${year}${month}-0001`
    }

    // Calculate amounts
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount - discountAmount

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: user.tenantId,
        clientId,
        invoiceNumber,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        total,
        dueDate: new Date(dueDate),
        notes,
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        client: true,
        items: true
      }
    })

    // Link deliveries if provided
    if (deliveryIds.length > 0) {
      await prisma.delivery.updateMany({
        where: {
          id: {
            in: deliveryIds
          },
          tenantId: user.tenantId
        },
        data: {
          invoiceId: invoice.id
        }
      })
    }

    return NextResponse.json(invoice, { status: 201 })

  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}