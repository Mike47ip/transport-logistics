// src/app/api/deliveries/[id]/status/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, notes } = await request.json()
    const deliveryId = params.id

    // Verify delivery belongs to user's tenant
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        tenantId: user.tenantId
      }
    })

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.role === 'DRIVER' && delivery.driverId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData = { status, notes }

    // Set timestamps based on status
    if (status === 'IN_PROGRESS' && !delivery.startedAt) {
      updateData.startedAt = new Date()
    } else if (status === 'DELIVERED' && !delivery.deliveredAt) {
      updateData.deliveredAt = new Date()
    }

    // Update vehicle status if needed
    if (delivery.vehicleId) {
      let vehicleStatus = 'AVAILABLE'
      if (status === 'IN_PROGRESS') vehicleStatus = 'IN_TRANSIT'
      
      await prisma.vehicle.update({
        where: { id: delivery.vehicleId },
        data: { status: vehicleStatus }
      })
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: {
        client: true,
        vehicle: true,
        driver: true
      }
    })

    return NextResponse.json(updatedDelivery)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    )
  }
}