// app/api/deliveries/[id]/status/route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(request, { params }) {
  try {
    console.log('📦 DELIVERY_STATUS_UPDATE: PATCH request for ID:', params.id)
    
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, location, notes, issueType, issueDescription } = await request.json()
    const deliveryId = params.id

    console.log('📦 DELIVERY_STATUS_UPDATE: Update data:', { status, location, notes, issueType })

    // Verify delivery belongs to user's tenant
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        tenantId: user.tenantId
      },
      include: {
        vehicle: true,
        driver: true
      }
    })

    if (!delivery) {
      console.log('📦 DELIVERY_STATUS_UPDATE: Delivery not found')
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.role === 'DRIVER' && delivery.driverId !== user.id) {
      console.log('📦 DELIVERY_STATUS_UPDATE: Driver not authorized for this delivery')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prepare update data
    const updateData = { 
      status,
      lastUpdatedBy: user.id,
      updatedAt: new Date()
    }

    // Update location if provided
    if (location) {
      updateData.currentLocation = location
    }

    // Set timestamps based on status changes
    if (status !== delivery.status) {
      switch (status) {
        case 'IN_PROGRESS':
          if (!delivery.startedAt) {
            updateData.startedAt = new Date()
          }
          break
        case 'OUT_FOR_DELIVERY':
          if (!delivery.outForDeliveryAt) {
            updateData.outForDeliveryAt = new Date()
          }
          break
        case 'DELIVERED':
          if (!delivery.deliveredAt) {
            updateData.deliveredAt = new Date()
          }
          break
        case 'RETURNED':
          if (!delivery.returnedAt) {
            updateData.returnedAt = new Date()
          }
          break
      }
    }

    // Handle issue reporting
    if (issueType) {
      updateData.issueReported = true
      updateData.currentIssue = issueType
    } else if (status === 'DELIVERED' || status === 'IN_PROGRESS') {
      // Clear issues when delivery progresses normally
      updateData.issueReported = false
      updateData.currentIssue = null
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
            select: { id: true, name: true, phone: true, email: true }
          },
          vehicle: {
            select: { id: true, licensePlate: true, make: true, model: true, type: true }
          },
          driver: {
            select: { id: true, name: true, phone: true, email: true }
          }
        }
      })

      // Create delivery update record
      await tx.deliveryUpdate.create({
        data: {
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

      // Update vehicle status if needed
      if (delivery.vehicleId) {
        let vehicleStatus = 'AVAILABLE'
        
        switch (status) {
          case 'IN_PROGRESS':
          case 'OUT_FOR_DELIVERY':
            vehicleStatus = 'IN_TRANSIT'
            break
          case 'DELIVERED':
          case 'CANCELLED':
          case 'RETURNED':
            vehicleStatus = 'AVAILABLE'
            break
          default:
            vehicleStatus = delivery.vehicle?.status || 'AVAILABLE'
        }

        await tx.vehicle.update({
          where: { id: delivery.vehicleId },
          data: { 
            status: vehicleStatus,
            ...(location && {
              lastKnownLat: null, // You'd parse coordinates from location if needed
              lastKnownLng: null,
              lastLocationUpdate: new Date()
            })
          }
        })
      }

      return updatedDelivery
    })

    console.log('📦 DELIVERY_STATUS_UPDATE: Update successful')

    // TODO: Send notifications to client if status changed
    // TODO: Log for audit trail
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('📦 DELIVERY_STATUS_UPDATE: Error:', error)
    return NextResponse.json(
      { error: 'Failed to update delivery status' },
      { status: 500 }
    )
  }
}