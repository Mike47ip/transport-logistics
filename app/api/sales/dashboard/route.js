// app/api/sales/dashboard/route.js
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
    const range = searchParams.get('range') || 'this-month'

    // Calculate date range
    const now = new Date()
    let startDate, endDate = now
    
    switch (range) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'this-week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
        break
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get deliveries for the period
    const deliveries = await prisma.delivery.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Calculate metrics
    const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED')
    const totalRevenue = completedDeliveries.reduce((sum, d) => sum + (d.actualPrice || d.estimatedPrice || 0), 0)
    
    // Get pending payments (delivered but not paid invoices)
    const pendingPayments = await prisma.delivery.aggregate({
      where: {
        tenantId: user.tenantId,
        status: 'DELIVERED',
        // Add invoice/payment tracking later
      },
      _sum: {
        actualPrice: true,
        estimatedPrice: true
      }
    })

    // Get unique active clients
    const activeClients = new Set(deliveries.map(d => d.clientId)).size

    // Calculate previous period for comparison
    const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
    const previousDeliveries = await prisma.delivery.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    })

    const previousCompletedDeliveries = previousDeliveries.filter(d => d.status === 'DELIVERED')
    const previousRevenue = previousCompletedDeliveries.reduce((sum, d) => sum + (d.actualPrice || d.estimatedPrice || 0), 0)

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0
    const deliveriesChange = previousCompletedDeliveries.length > 0 ? 
      ((completedDeliveries.length - previousCompletedDeliveries.length) / previousCompletedDeliveries.length * 100) : 0

    // Get top clients by revenue
    const clientRevenue = {}
    completedDeliveries.forEach(delivery => {
      const clientId = delivery.clientId
      const revenue = delivery.actualPrice || delivery.estimatedPrice || 0
      
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = {
          id: clientId,
          name: delivery.client.name,
          revenue: 0,
          deliveries: 0
        }
      }
      
      clientRevenue[clientId].revenue += revenue
      clientRevenue[clientId].deliveries += 1
    })

    const topClients = Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Daily revenue for charts (last 30 days)
    const dailyRevenue = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      
      const dayDeliveries = deliveries.filter(d => 
        d.deliveredAt >= dayStart && d.deliveredAt < dayEnd && d.status === 'DELIVERED'
      )
      
      const dayRevenue = dayDeliveries.reduce((sum, d) => sum + (d.actualPrice || d.estimatedPrice || 0), 0)
      
      dailyRevenue.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        deliveries: dayDeliveries.length
      })
    }

    const dashboardData = {
      totalRevenue,
      completedDeliveries: completedDeliveries.length,
      activeClients,
      pendingPayments: pendingPayments._sum.actualPrice || pendingPayments._sum.estimatedPrice || 0,
      revenueChange: Math.round(revenueChange * 100) / 100,
      deliveriesChange: Math.round(deliveriesChange * 100) / 100,
      clientsChange: 0, // Calculate if needed
      paymentsChange: 0, // Calculate if needed
      topClients,
      dailyRevenue,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        range
      }
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Sales dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    )
  }
}