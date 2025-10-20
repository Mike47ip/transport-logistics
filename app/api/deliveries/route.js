// src/app/api/deliveries/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { validateDeliveryData, generateTrackingNumber } from '@/lib/utils'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where = {
      tenantId: user.tenantId,
      ...(status && { status }),
      ...(user.role === 'DRIVER' && { driverId: user.id })
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, phone: true }
        },
        vehicle: {
          select: { id: true, licensePlate: true, make: true, model: true }
        },
        driver: {
          select: { id: true, name: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.delivery.count({ where })

    return NextResponse.json({
      deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const errors = validateDeliveryData(data)
    
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    const delivery = await prisma.delivery.create({
      data: {
        ...data,
        tenantId: user.tenantId,
        trackingNumber: generateTrackingNumber()
      },
      include: {
        client: true,
        vehicle: true,
        driver: true
      }
    })

    return NextResponse.json(delivery)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    )
  }
}
