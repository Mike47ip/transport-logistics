// app/api/deliveries/[id]/status/route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(request, { params }) {
  try {
    // Fix: Await params for Next.js 15
    const { id } = await params
    console.log('📦 DELIVERY_STATUS_UPDATE: PATCH request for ID:', id)

    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, location, notes, issueType, issueDescription } = await request.json()
    const deliveryId = id

    console.log('📦 DELIVERY_STATUS_UPDATE: Update data:', { status, location, notes, issueType })

    // Build update data object with correct field names
    const updateData = {
      status,
      lastUpdatedBy: user.id,
      updatedAt: new Date(),
      issueReported: !!issueType,
      issueType: issueType || null,  // Use issueType not currentIssue
      issueDescription: issueDescription || null,
      currentLocation: location || null,
      lastLocationUpdate: location ? new Date() : undefined
    }

    // Set timestamp fields based on status
    if (status === 'IN_PROGRESS') {
      updateData.startedAt = new Date()
    } else if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date()
    } else if (status === 'OUT_FOR_DELIVERY') {
      updateData.outForDeliveryAt = new Date()
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    } else if (status === 'RETURNED') {
      updateData.returnedAt = new Date()
    }

    console.log('📦 DELIVERY_STATUS_UPDATE: Updating delivery...')

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the delivery
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          vehicle: {
            select: {
              id: true,
              licensePlate: true,
              make: true,
              model: true,
              type: true
            }
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          }
        }
      })

      // Create status history entry
      await tx.deliveryStatusHistory.create({
        data: {
          tenantId: updatedDelivery.tenantId,
          deliveryId: deliveryId,
          status: status,
          location: location || null,
          notes: notes || null,
          issueType: issueType || null,
          issueDescription: issueDescription || null,
          updatedBy: user.id,
          isAutomatic: false
        }
      })

      return updatedDelivery
    })

    console.log('📦 DELIVERY_STATUS_UPDATE: Success!')
    return NextResponse.json(result)

  } catch (error) {
    console.error('📦 DELIVERY_STATUS_UPDATE: Error:', error)
    return NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    )
  }
}