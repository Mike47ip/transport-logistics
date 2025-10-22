// app\api\deliveries\route.js


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Generate unique tracking number
function generateTrackingNumber() {
  const prefix = 'TRK';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export async function GET(request) {
  try {
    console.log('📦 DELIVERIES_API: GET request started')
    
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📦 DELIVERIES_API: User authenticated:', user.role)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const driverId = searchParams.get('driverId')

    const where = {
      tenantId: user.tenantId,
      ...(status && { status }),
      ...(driverId && { driverId })
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true }
        },
        vehicle: {
          select: { id: true, licensePlate: true, make: true, model: true }
        },
        driver: {
          select: { id: true, name: true, phone: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('📦 DELIVERIES_API: Found deliveries count:', deliveries.length)
    return NextResponse.json(deliveries)
  } catch (error) {
    console.error('📦 DELIVERIES_API: Error fetching deliveries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('📦 DELIVERIES_API: POST request started')
    
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      console.log('📦 DELIVERIES_API: Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('📦 DELIVERIES_API: Request data:', data)

    // Validate required fields
    if (!data.clientId || !data.pickupAddress || !data.deliveryAddress || !data.cargoDescription) {
      console.log('📦 DELIVERIES_API: Missing required fields')
      return NextResponse.json(
        { error: 'Client, pickup address, delivery address, and cargo description are required' },
        { status: 400 }
      )
    }

    // Verify client belongs to user's tenant
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        tenantId: user.tenantId
      }
    })

    if (!client) {
      console.log('📦 DELIVERIES_API: Client not found or unauthorized')
      return NextResponse.json({ error: 'Client not found' }, { status: 400 })
    }

    // If vehicle/driver specified, verify they belong to tenant
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

    const trackingNumber = generateTrackingNumber()
    console.log('📦 DELIVERIES_API: Generated tracking number:', trackingNumber)

    console.log('📦 DELIVERIES_API: Creating delivery in database...')
    const delivery = await prisma.delivery.create({
      data: {
        trackingNumber,
        clientId: data.clientId,
        vehicleId: data.vehicleId || null,
        driverId: data.driverId || null,
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat || null,
        pickupLng: data.pickupLng || null,
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat || null,
        deliveryLng: data.deliveryLng || null,
        cargoDescription: data.cargoDescription,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
        specialInstructions: data.specialInstructions || null,
        priority: data.priority || 'NORMAL',
        estimatedPrice: data.estimatedPrice || null,
        distance: data.distance || null,
        estimatedDuration: data.estimatedDuration || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        notes: data.notes || null,
        tenantId: user.tenantId,
        status: data.vehicleId && data.driverId ? 'ASSIGNED' : 'PENDING'
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true, email: true }
        },
        vehicle: {
          select: { id: true, licensePlate: true, make: true, model: true }
        },
        driver: {
          select: { id: true, name: true, phone: true, email: true }
        }
      }
    })

    console.log('📦 DELIVERIES_API: Delivery created successfully:', delivery.id)
    return NextResponse.json(delivery)
  } catch (error) {
    console.error('📦 DELIVERIES_API: Error details:', error)
    console.error('📦 DELIVERIES_API: Error message:', error.message)
    return NextResponse.json(
      { error: 'Failed to create delivery' },
      { status: 500 }
    )
  }
}