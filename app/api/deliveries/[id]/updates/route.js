// app/api/deliveries/[id]/updates/route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    console.log('📦 DELIVERY_UPDATES: GET request for delivery ID:', params.id)
    
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deliveryId = params.id

    // Verify delivery belongs to user's tenant
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        tenantId: user.tenantId
      }
    })

    if (!delivery) {
      console.log('📦 DELIVERY_UPDATES: Delivery not found or unauthorized')
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Fetch all updates for this delivery
    const updates = await prisma.deliveryUpdate.findMany({
      where: {
        deliveryId: deliveryId
      },
      include: {
        updater: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📦 DELIVERY_UPDATES: Found updates count:', updates.length)
    return NextResponse.json(updates)
  } catch (error) {
    console.error('📦 DELIVERY_UPDATES: Error fetching updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery updates' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    console.log('📦 DELIVERY_UPDATES: POST request for delivery ID:', params.id)
    
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deliveryId = params.id
    const { status, location, notes, issueType, issueDescription, latitude, longitude } = await request.json()

    // Verify delivery belongs to user's tenant and user has permission
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        tenantId: user.tenantId
      }
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Check permissions - drivers can only update their assigned deliveries
    if (user.role === 'DRIVER' && delivery.driverId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create the update record
    const update = await prisma.deliveryUpdate.create({
      data: {
        deliveryId: deliveryId,
        status: status || delivery.status,
        location: location || null,
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || null,
        issueType: issueType || null,
        issueDescription: issueDescription || null,
        updatedBy: user.id,
        isAutomatic: false
      },
      include: {
        updater: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    console.log('📦 DELIVERY_UPDATES: Update created successfully:', update.id)
    return NextResponse.json(update)
  } catch (error) {
    console.error('📦 DELIVERY_UPDATES: Error creating update:', error)
    return NextResponse.json(
      { error: 'Failed to create delivery update' },
      { status: 500 }
    )
  }
}