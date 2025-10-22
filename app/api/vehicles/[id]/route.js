// app\api\vehicles\[id]\route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    console.log('🔥 VEHICLE_UPDATE: PUT request for ID:', params.id)
    
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('🔥 VEHICLE_UPDATE: Data:', data)

    const existingVehicle = await prisma.vehicle.findFirst({
      where: { id: params.id, tenantId: user.tenantId }
    })

    if (!existingVehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: params.id },
      data: data,
      include: {
        assignedDriver: { select: { id: true, name: true, email: true } }
      }
    })

    return NextResponse.json(updatedVehicle)
  } catch (error) {
    console.error('🔥 VEHICLE_UPDATE: Error:', error)
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
  }
}