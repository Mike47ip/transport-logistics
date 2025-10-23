// app/api/dashboard/route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request) {
  try {
    console.log('📊 DASHBOARD_API: GET request started')
    
    const user = await getCurrentUser(request)
    if (!user) {
      console.log('📊 DASHBOARD_API: User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 DASHBOARD_API: User authenticated:', user.role)

    // Get current date ranges for analytics
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Use Prisma queries instead of raw SQL to avoid column name issues
    const [
      // Basic counts
      totalDeliveries,
      totalVehicles,
      totalDrivers,
      totalClients,
      
      // Delivery status breakdown
      deliveryStatusStats,
      
      // Time-based delivery counts
      deliveriesToday,
      deliveriesThisWeek,
      deliveriesThisMonth,
      deliveriesLast30Days,
      
      // Priority breakdown
      priorityStats,
      
      // Vehicle status
      vehicleStatusStats,
      
      // Driver performance
      activeDriversCount,
      
      // Recent activities
      recentDeliveries,
      pendingDeliveries,
      
      // Financial data
      revenueData,
      revenueThisMonth,
      revenueLast30Days,
      
      // Performance metrics
      deliveryCompletionStats,
      
      // Alerts
      overdueDeliveries,
      driversWithoutVehicles
      
    ] = await Promise.all([
      
      // Basic counts
      prisma.delivery.count({
        where: { tenantId: user.tenantId }
      }),
      
      prisma.vehicle.count({
        where: { tenantId: user.tenantId, isActive: true }
      }),
      
      prisma.user.count({
        where: { tenantId: user.tenantId, role: 'DRIVER', isActive: true }
      }),
      
      prisma.client.count({
        where: { tenantId: user.tenantId, isActive: true }
      }),

      // Delivery status breakdown
      prisma.delivery.groupBy({
        by: ['status'],
        where: { tenantId: user.tenantId },
        _count: { status: true }
      }),

      // Time-based deliveries
      prisma.delivery.count({
        where: { 
          tenantId: user.tenantId,
          createdAt: { gte: startOfToday }
        }
      }),

      prisma.delivery.count({
        where: { 
          tenantId: user.tenantId,
          createdAt: { gte: startOfWeek }
        }
      }),

      prisma.delivery.count({
        where: { 
          tenantId: user.tenantId,
          createdAt: { gte: startOfMonth }
        }
      }),

      prisma.delivery.count({
        where: { 
          tenantId: user.tenantId,
          createdAt: { gte: last30Days }
        }
      }),

      // Priority breakdown
      prisma.delivery.groupBy({
        by: ['priority'],
        where: { tenantId: user.tenantId },
        _count: { priority: true }
      }),

      // Vehicle status
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { tenantId: user.tenantId, isActive: true },
        _count: { status: true }
      }),

      // Active drivers
      prisma.user.count({
        where: { 
          tenantId: user.tenantId,
          role: 'DRIVER',
          isActive: true,
          OR: [
            { assignedVehicles: { some: {} } },
            { deliveries: { some: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } } }
          ]
        }
      }),

      // Recent deliveries
      prisma.delivery.findMany({
        where: { tenantId: user.tenantId },
        include: {
          client: { select: { name: true, phone: true } },
          vehicle: { select: { licensePlate: true, make: true, model: true } },
          driver: { select: { name: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Pending deliveries
      prisma.delivery.findMany({
        where: { 
          tenantId: user.tenantId,
          status: 'PENDING'
        },
        include: {
          client: { select: { name: true, phone: true } }
        },
        orderBy: { createdAt: 'asc' },
        take: 5
      }),

      // Revenue data
      prisma.delivery.aggregate({
        where: {
          tenantId: user.tenantId,
          status: 'DELIVERED',
          actualPrice: { not: null }
        },
        _sum: { actualPrice: true },
        _avg: { actualPrice: true },
        _count: { actualPrice: true }
      }),

      prisma.delivery.aggregate({
        where: {
          tenantId: user.tenantId,
          status: 'DELIVERED',
          actualPrice: { not: null },
          deliveredAt: { gte: startOfMonth }
        },
        _sum: { actualPrice: true }
      }),

      prisma.delivery.aggregate({
        where: {
          tenantId: user.tenantId,
          status: 'DELIVERED',
          actualPrice: { not: null },
          deliveredAt: { gte: last30Days }
        },
        _sum: { actualPrice: true }
      }),

      // Performance metrics
      prisma.delivery.groupBy({
        by: ['status'],
        where: { 
          tenantId: user.tenantId,
          createdAt: { gte: last30Days }
        },
        _count: { status: true }
      }),

      // Alerts - Overdue deliveries
      prisma.delivery.findMany({
        where: {
          tenantId: user.tenantId,
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
          scheduledAt: { lt: now }
        },
        include: {
          client: { select: { name: true } }
        }
      }),

      // Drivers without vehicles
      prisma.user.findMany({
        where: {
          tenantId: user.tenantId,
          role: 'DRIVER',
          isActive: true,
          assignedVehicles: { none: {} }
        },
        select: { id: true, name: true, phone: true }
      })
    ])

    // Get daily deliveries for chart (last 30 days)
    const dailyDeliveries = await prisma.delivery.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: last30Days }
      },
      select: {
        createdAt: true,
        status: true
      }
    })

    // Process daily data
    const dailyStats = {}
    dailyDeliveries.forEach(delivery => {
      const date = delivery.createdAt.toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, delivered: 0 }
      }
      dailyStats[date].total++
      if (delivery.status === 'DELIVERED') {
        dailyStats[date].delivered++
      }
    })

    // Convert to array format
    const dailyChart = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      total: stats.total,
      delivered: stats.delivered
    })).sort((a, b) => new Date(a.date) - new Date(b.date))

    // Get top clients
    const clientActivity = await prisma.client.findMany({
      where: { tenantId: user.tenantId },
      include: {
        _count: {
          select: {
            deliveries: {
              where: { createdAt: { gte: last30Days } }
            }
          }
        }
      },
      orderBy: {
        deliveries: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Process and format the data
    const dashboardData = {
      overview: {
        totalDeliveries,
        totalVehicles,
        totalDrivers,
        totalClients,
        deliveriesToday,
        deliveriesThisWeek,
        deliveriesThisMonth,
        deliveriesLast30Days,
        activeDriversCount
      },

      revenue: {
        totalRevenue: revenueData._sum.actualPrice || 0,
        averageOrderValue: revenueData._avg.actualPrice || 0,
        totalCompletedDeliveries: revenueData._count.actualPrice || 0,
        revenueThisMonth: revenueThisMonth._sum.actualPrice || 0,
        revenueLast30Days: revenueLast30Days._sum.actualPrice || 0
      },

      performance: {
        completionRate: deliveryCompletionStats.length > 0 ? 
          ((deliveryCompletionStats.find(s => s.status === 'DELIVERED')?._count?.status || 0) / 
           deliveryCompletionStats.reduce((sum, s) => sum + s._count.status, 0) * 100).toFixed(1) : '0',
        averageDeliveryTime: '2.5' // Placeholder since complex calculation needs raw SQL
      },

      charts: {
        deliveryStatus: deliveryStatusStats.map(stat => ({
          status: stat.status,
          count: stat._count.status,
          percentage: totalDeliveries > 0 ? ((stat._count.status / totalDeliveries) * 100).toFixed(1) : '0'
        })),

        priority: priorityStats.map(stat => ({
          priority: stat.priority,
          count: stat._count.priority
        })),

        vehicleStatus: vehicleStatusStats.map(stat => ({
          status: stat.status,
          count: stat._count.status
        })),

        dailyDeliveries: dailyChart,

        topClients: clientActivity.slice(0, 5).map(client => ({
          name: client.name,
          deliveries: client._count.deliveries
        }))
      },

      recentActivity: {
        recentDeliveries: recentDeliveries.slice(0, 5).map(delivery => ({
          id: delivery.id,
          trackingNumber: delivery.trackingNumber,
          client: delivery.client?.name,
          status: delivery.status,
          priority: delivery.priority,
          createdAt: delivery.createdAt,
          vehicle: delivery.vehicle ? 
            `${delivery.vehicle.make} ${delivery.vehicle.model} (${delivery.vehicle.licensePlate})` : 
            'Not assigned',
          driver: delivery.driver?.name || 'Not assigned'
        })),

        pendingDeliveries: pendingDeliveries.map(delivery => ({
          id: delivery.id,
          trackingNumber: delivery.trackingNumber,
          client: delivery.client?.name,
          createdAt: delivery.createdAt,
          priority: delivery.priority
        }))
      },

      alerts: {
        overdueCount: overdueDeliveries.length,
        overdueDeliveries: overdueDeliveries.slice(0, 3).map(delivery => ({
          trackingNumber: delivery.trackingNumber,
          client: delivery.client?.name,
          scheduledAt: delivery.scheduledAt
        })),
        
        unassignedDrivers: driversWithoutVehicles.length,
        
        notifications: [
          ...(overdueDeliveries.length > 0 ? [{
            type: 'warning',
            message: `${overdueDeliveries.length} deliveries are overdue`,
            action: 'View overdue deliveries'
          }] : []),
          
          ...(driversWithoutVehicles.length > 0 ? [{
            type: 'info',
            message: `${driversWithoutVehicles.length} drivers don't have assigned vehicles`,
            action: 'Assign vehicles'
          }] : [])
        ]
      }
    }

    console.log('📊 DASHBOARD_API: Dashboard data compiled successfully')
    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('📊 DASHBOARD_API: Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    )
  }
}