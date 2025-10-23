// app/api/deliveries/[id]/route.js
// PUT endpoint to update delivery

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fix 1: Await params in Next.js 15
    const { id } = await params
    const data = await request.json()
    
    // Fix 2: Validate and fix datetime format
    const processedData = {
      ...data,
      // Convert datetime-local format to proper ISO string
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
      pickupDateTime: data.pickupDateTime ? new Date(data.pickupDateTime).toISOString() : null,
      deliveryDateTime: data.deliveryDateTime ? new Date(data.deliveryDateTime).toISOString() : null,
    }
    
    // Get current delivery to compare status change
    const currentDelivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        client: true,
        driver: true,
        vehicle: true
      }
    })

    if (!currentDelivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Check if status changed (for status history)
    const statusChanged = processedData.status && processedData.status !== currentDelivery.status
    const previousStatus = currentDelivery.status

    // Update the delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: {
        ...processedData,
        updatedAt: new Date(),
        // Update location timestamp if assignment happened
        lastLocationUpdate: (processedData.status === 'ASSIGNED' && previousStatus === 'PENDING') 
          ? new Date() 
          : currentDelivery.lastLocationUpdate
      },
      include: {
        client: true,
        driver: true,
        vehicle: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            updatedByUser: {
              select: { name: true, role: true }
            }
          }
        }
      }
    })

    // Create status history entry if status changed
    if (statusChanged) {
      await prisma.deliveryStatusHistory.create({
        data: {
          tenantId: updatedDelivery.tenantId,
          deliveryId: id,
          status: processedData.status,
          previousStatus: previousStatus,
          location: processedData.status === 'ASSIGNED' ? 'System Assignment' : null,
          notes: processedData.status === 'ASSIGNED' ? 
            `Driver ${updatedDelivery.driver?.name} and vehicle ${updatedDelivery.vehicle?.licensePlate} assigned` :
            `Delivery details updated`,
          updatedBy: currentUser.id,
          isAutomatic: processedData.status === 'ASSIGNED' && previousStatus === 'PENDING'
        }
      })
    }

    // Send assignment notification if auto-assigned
    if (processedData.status === 'ASSIGNED' && previousStatus === 'PENDING') {
      await createAssignmentNotification(updatedDelivery)
    }

    return NextResponse.json(updatedDelivery)
  } catch (error) {
    console.error('Error updating delivery:', error)
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    )
  }
}

// Helper function to create assignment notification
async function createAssignmentNotification(delivery) {
  try {
    if (delivery.client.email || delivery.client.phone) {
      await prisma.deliveryNotification.create({
        data: {
          deliveryId: delivery.id,
          type: 'STATUS_UPDATE',
          method: delivery.client.email ? 'EMAIL' : 'SMS',
          recipient: delivery.client.email || delivery.client.phone,
          subject: `Delivery ${delivery.trackingNumber} - Driver Assigned`,
          message: `Your delivery has been assigned to driver ${delivery.driver?.name} with vehicle ${delivery.vehicle?.licensePlate}. Track your delivery: ${delivery.trackingNumber}`
        }
      })
    }
  } catch (error) {
    console.error('Failed to create assignment notification:', error)
  }
}