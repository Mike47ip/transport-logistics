// src/app/api/dashboard/stats/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [
      totalVehicles,
      activeDeliveries,
      totalClients,
      monthlyRevenue,
      vehicleStats,
      recentDeliveries
    ] = await Promise.all([
      // Total vehicles
      prisma.vehicle.count({
        where: { tenantId: user.tenantId, isActive: true }
      }),

      // Active deliveries
      prisma.delivery.count({
        where: {
          tenantId: user.tenantId,
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
        }
      }),

      // Total clients
      prisma.client.count({
        where: { tenantId: user.tenantId, isActive: true }
      }),

      // Monthly revenue
      prisma.delivery.aggregate({
        where: {
          tenantId: user.tenantId,
          status: 'DELIVERED',
          deliveredAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { actualPrice: true }
      }),

      // Vehicle status breakdown
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { tenantId: user.tenantId, isActive: true },
        _count: { status: true }
      }),

      // Recent deliveries
      prisma.delivery.findMany({
        where: { tenantId: user.tenantId },
        include: {
          client: { select: { name: true } },
          vehicle: { select: { licensePlate: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    const stats = {
      totalVehicles,
      activeDeliveries,
      totalClients,
      monthlyRevenue: monthlyRevenue._sum.actualPrice || 0,
      vehicleStats: vehicleStats.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {}),
      recentDeliveries
    }

    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}