// app/api/deliveries/[id]/route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const { id } = await params // Fix: await params
    console.log('📦 DELIVERY_DETAIL: GET request for ID:', id)
    
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId
      },
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

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    console.log('📦 DELIVERY_DETAIL: Found delivery:', delivery.trackingNumber)
    return NextResponse.json(delivery)
  } catch (error) {
    console.error('📦 DELIVERY_DETAIL: Error fetching delivery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params // Fix: await params
    console.log('📦 DELIVERY_UPDATE: PUT request for ID:', id)
    
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER', 'DRIVER'].includes(user.role)) {
      console.log('📦 DELIVERY_UPDATE: Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let data = await request.json() // Fix: use let instead of const
    console.log('📦 DELIVERY_UPDATE: Update data:', data)

    // Verify delivery belongs to user's tenant
    const existingDelivery = await prisma.delivery.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId
      }
    })

    if (!existingDelivery) {
      console.log('📦 DELIVERY_UPDATE: Delivery not found or unauthorized')
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // If driver role, only allow status updates for assigned deliveries
    if (user.role === 'DRIVER') {
      if (existingDelivery.driverId !== user.id) {
        return NextResponse.json({ error: 'Can only update assigned deliveries' }, { status: 403 })
      }
      // Drivers can only update status and some fields
      const allowedFields = ['status', 'notes', 'pickupDateTime', 'deliveryDateTime', 'startedAt', 'deliveredAt']
      const filteredData = Object.keys(data)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = data[key]
          return obj
        }, {})
      data = filteredData // This was the const reassignment error
    }

    // Fix datetime formatting - convert to proper ISO format
    const processDatetime = (dateValue) => {
      if (!dateValue) return null
      
      // If it's already a full ISO string, use it
      if (typeof dateValue === 'string' && dateValue.includes('T') && dateValue.length > 16) {
        return new Date(dateValue)
      }
      
      // If it's a short format like "2025-10-23T16:09", add seconds and timezone
      if (typeof dateValue === 'string' && dateValue.includes('T')) {
        return new Date(dateValue + ':00.000Z')
      }
      
      return new Date(dateValue)
    }

    // Process all datetime fields
    if (data.scheduledAt) {
      data.scheduledAt = processDatetime(data.scheduledAt)
    }
    if (data.pickupDateTime) {
      data.pickupDateTime = processDatetime(data.pickupDateTime)
    }
    if (data.deliveryDateTime) {
      data.deliveryDateTime = processDatetime(data.deliveryDateTime)
    }

    // Auto-set timestamps based on status changes
    if (data.status) {
      if (data.status === 'IN_PROGRESS' && !existingDelivery.startedAt && !data.startedAt) {
        data.startedAt = new Date()
      }
      if (data.status === 'DELIVERED' && !existingDelivery.deliveredAt && !data.deliveredAt) {
        data.deliveredAt = new Date()
      }
    }

    // Validate vehicle and driver assignments if provided
    if (data.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: {
          id: data.vehicleId,
          tenantId: user.tenantId
        }
      })
      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 400 })
      }
    }

    if (data.driverId) {
      const driver = await prisma.user.findFirst({
        where: {
          id: data.driverId,
          tenantId: user.tenantId,
          role: 'DRIVER'
        }
      })
      if (!driver) {
        return NextResponse.json({ error: 'Driver not found' }, { status: 400 })
      }
    }

    // Add lastUpdatedBy
    data.lastUpdatedBy = user.id

    console.log('📦 DELIVERY_UPDATE: Updating delivery in database...')
    const updatedDelivery = await prisma.delivery.update({
      where: { id: id },
      data: data,
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

    console.log('📦 DELIVERY_UPDATE: Delivery updated successfully:', updatedDelivery.id)
    return NextResponse.json(updatedDelivery)
  } catch (error) {
    console.error('📦 DELIVERY_UPDATE: Error details:', error)
    console.error('📦 DELIVERY_UPDATE: Error message:', error.message)
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params // Fix: await params
    console.log('📦 DELIVERY_DELETE: DELETE request for ID:', id)
    
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      console.log('📦 DELIVERY_DELETE: Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify delivery belongs to user's tenant
    const existingDelivery = await prisma.delivery.findFirst({
      where: {
        id: id,
        tenantId: user.tenantId
      }
    })

    if (!existingDelivery) {
      console.log('📦 DELIVERY_DELETE: Delivery not found or unauthorized')
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Prevent deletion of deliveries that are in progress or delivered
    if (['IN_PROGRESS', 'DELIVERED'].includes(existingDelivery.status)) {
      return NextResponse.json(
        { error: 'Cannot delete deliveries that are in progress or completed' },
        { status: 400 }
      )
    }

    console.log('📦 DELIVERY_DELETE: Deleting delivery from database...')
    await prisma.delivery.delete({
      where: { id: id }
    })

    console.log('📦 DELIVERY_DELETE: Delivery deleted successfully:', id)
    return NextResponse.json({ message: 'Delivery deleted successfully' })
  } catch (error) {
    console.error('📦 DELIVERY_DELETE: Error details:', error)
    console.error('📦 DELIVERY_DELETE: Error message:', error.message)
    return NextResponse.json(
      { error: 'Failed to delete delivery' },
      { status: 500 }
    )
  }
}