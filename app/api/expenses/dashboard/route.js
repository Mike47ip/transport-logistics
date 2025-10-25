// app/api/expenses/dashboard/route.js
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

    // Build base where clause
    const baseWhere = {
      tenantId: user.tenantId,
      ...(vehicleId && vehicleId !== 'all' && { vehicleId }),
      ...(Object.keys(dateFilter).length > 0 && { expenseDate: dateFilter })
    }

    // Total expenses
    const totalExpensesResult = await prisma.expense.aggregate({
      where: baseWhere,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    })

    // Registration-specific expenses
    const registrationExpensesResult = await prisma.expense.aggregate({
      where: {
        ...baseWhere,
        category: {
          in: ['REGISTRATION', 'ROADWORTHY', 'INCOME_TAX']
        }
      },
      _sum: {
        amount: true
      }
    })

    // Insurance expenses
    const insuranceExpensesResult = await prisma.expense.aggregate({
      where: {
        ...baseWhere,
        category: 'INSURANCE'
      },
      _sum: {
        amount: true
      }
    })

    // Category breakdown for pie chart
    const categoryBreakdown = await prisma.expense.groupBy({
      by: ['category'],
      where: baseWhere,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      }
    })

    // Active vehicles count
    const activeVehiclesCount = await prisma.vehicle.count({
      where: {
        tenantId: user.tenantId,
        status: 'ACTIVE'
      }
    })

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthlyExpenses = await prisma.expense.aggregate({
        where: {
          ...baseWhere,
          expenseDate: {
            gte: monthDate,
            lt: nextMonth
          }
        },
        _sum: {
          amount: true
        }
      })

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        amount: monthlyExpenses._sum.amount || 0
      })
    }

    // Transform category breakdown for frontend
    const formattedCategoryBreakdown = categoryBreakdown.map(item => ({
      category: item.category,
      total: item._sum.amount || 0,
      count: item._count.id
    }))

    const dashboardData = {
      totalExpenses: totalExpensesResult._sum.amount || 0,
      totalExpenseCount: totalExpensesResult._count.id || 0,
      registrationExpenses: registrationExpensesResult._sum.amount || 0,
      insuranceExpenses: insuranceExpensesResult._sum.amount || 0,
      activeVehicles: activeVehiclesCount,
      categoryBreakdown: formattedCategoryBreakdown,
      monthlyTrend,
      // Calculate averages
      averageExpensePerVehicle: activeVehiclesCount > 0 ? 
        (totalExpensesResult._sum.amount || 0) / activeVehiclesCount : 0,
      // Period info
      period: range,
      dateRange: {
        start: Object.keys(dateFilter).length > 0 ? dateFilter.gte : null,
        end: dateFilter.lte || null
      }
    }

    console.log('📊 Expense dashboard data compiled successfully')
    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Expense dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expense dashboard data' },
      { status: 500 }
    )
  }
}