// app/api/expenses/route.js
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
    const vehicleId = searchParams.get('vehicleId')
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const range = searchParams.get('range') || 'this-month'

    // Build date filter based on range
    let dateFilter = {}
    const now = new Date()
    
    switch (range) {
      case 'this-week':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
        startOfWeek.setHours(0, 0, 0, 0)
        dateFilter.gte = startOfWeek
        break
      case 'this-month':
        dateFilter.gte = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        dateFilter.gte = lastMonth
        dateFilter.lte = endLastMonth
        break
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        dateFilter.gte = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'this-year':
        dateFilter.gte = new Date(now.getFullYear(), 0, 1)
        break
    }

    // Build where clause
    const where = {
      tenantId: user.tenantId,
      ...(vehicleId && vehicleId !== 'all' && { vehicleId }),
      ...(category && category !== 'all' && { category }),
      ...(status && status !== 'all' && { status }),
      ...(Object.keys(dateFilter).length > 0 && { expenseDate: dateFilter })
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
            year: true
          }
        }
      },
      orderBy: {
        expenseDate: 'desc'
      }
    })

    return NextResponse.json(expenses)

  } catch (error) {
    console.error('Expenses fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
      vehicleId,
      category,
      description,
      amount,
      expenseDate,
      notes,
      receiptNumber,
      vendor,
      status = 'PENDING'
    } = data

    // Validate required fields
    if (!vehicleId || !category || !description || !amount || !expenseDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify vehicle belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        tenantId: user.tenantId
      }
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId: user.tenantId,
        vehicleId,
        category,
        description,
        amount: parseFloat(amount),
        expenseDate: new Date(expenseDate),
        notes: notes || null,
        receiptNumber: receiptNumber || null,
        vendor: vendor || null,
        status
      },
      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            make: true,
            model: true,
            year: true
          }
        }
      }
    })

    console.log('✅ Expense created:', expense.id)
    return NextResponse.json(expense)

  } catch (error) {
    console.error('Expense creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}