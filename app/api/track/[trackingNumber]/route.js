import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    console.log('📍 TRACK_API: GET request for tracking number:', params.trackingNumber)
    
    const trackingNumber = params.trackingNumber

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 })
    }

    // Find delivery by tracking number (no tenant restriction for public tracking)
    const delivery = await prisma.delivery.findFirst({
      where: {
        trackingNumber: trackingNumber.toUpperCase()
      },
      include: {
        client: {
          select: { name: true } // Only include client name for privacy
        },
        vehicle: {
          select: { 
            licensePlate: true, 
            make: true, 
            model: true,
            type: true
          }
        },
        driver: {
          select: { 
            name: true,
            phone: true // Include phone for customer contact
          }
        }
      }
    })

    if (!delivery) {
      console.log('📍 TRACK_API: Delivery not found for tracking number:', trackingNumber)
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Return limited information for privacy
    const publicDeliveryInfo = {
      id: delivery.id,
      trackingNumber: delivery.trackingNumber,
      status: delivery.status,
      priority: delivery.priority,
      pickupAddress: delivery.pickupAddress,
      deliveryAddress: delivery.deliveryAddress,
      cargoDescription: delivery.cargoDescription,
      weight: delivery.weight,
      dimensions: delivery.dimensions,
      specialInstructions: delivery.specialInstructions,
      distance: delivery.distance,
      estimatedDuration: delivery.estimatedDuration,
      scheduledAt: delivery.scheduledAt,
      startedAt: delivery.startedAt,
      pickupDateTime: delivery.pickupDateTime,
      deliveryDateTime: delivery.deliveryDateTime,
      deliveredAt: delivery.deliveredAt,
      createdAt: delivery.createdAt,
      client: {
        name: delivery.client.name
      },
      vehicle: delivery.vehicle ? {
        licensePlate: delivery.vehicle.licensePlate,
        make: delivery.vehicle.make,
        model: delivery.vehicle.model,
        type: delivery.vehicle.type
      } : null,
      driver: delivery.driver ? {
        name: delivery.driver.name,
        phone: delivery.driver.phone
      } : null
    }

    console.log('📍 TRACK_API: Found delivery:', delivery.trackingNumber, 'Status:', delivery.status)
    return NextResponse.json(publicDeliveryInfo)
  } catch (error) {
    console.error('📍 TRACK_API: Error tracking delivery:', error)
    return NextResponse.json(
      { error: 'Failed to track delivery' },
      { status: 500 }
    )
  }
}