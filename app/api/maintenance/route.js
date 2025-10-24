// src/app/api/maintenance/route.js
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
    const status = searchParams.get('status')
    const vehicleId = searchParams.get('vehicleId')

    const where = {
      tenantId: user.tenantId,
      ...(status && { status }),
      ...(vehicleId && { vehicleId })
    }

    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where,
      include: {
        vehicle: {
          select: { 
            id: true, 
            licensePlate: true, 
            make: true, 
            model: true 
          }
        },
        technician: {
          select: { id: true, name: true }
        }
      },
      orderBy: { scheduledAt: 'desc' }
    })

    return NextResponse.json(maintenanceRecords)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
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

    if (!data.vehicleId || !data.title || !data.scheduledAt) {
      return NextResponse.json(
        { error: 'Vehicle, title, and scheduled date are required' },
        { status: 400 }
      )
    }

    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: {
        ...data,
        tenantId: user.tenantId
      },
      include: {
        vehicle: true,
        technician: true
      }
    })

    return NextResponse.json(maintenanceRecord)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    )
  }
}