// src/app/api/vehicles/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { validateVehicleData } from '@/lib/validations'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true
      },
      include: {
        assignedDriver: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            deliveries: {
              where: {
                status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
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
    const errors = validateVehicleData(data)
    
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    // Check if license plate exists for this tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        licensePlate: data.licensePlate,
        tenantId: user.tenantId
      }
    })

    if (existingVehicle) {
      return NextResponse.json(
        { error: 'Vehicle with this license plate already exists' },
        { status: 400 }
      )
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        tenantId: user.tenantId
      },
      include: {
        assignedDriver: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}