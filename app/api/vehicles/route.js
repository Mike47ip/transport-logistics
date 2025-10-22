import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { validateVehicleData } from '@/lib/validation'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true
      },
      include: {
        assignedDriver: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            deliveries: {
              where: {
                status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('🔥 VEHICLE_API: POST request started')
    
    const user = await getCurrentUser(request)
    console.log('🔥 VEHICLE_API: User authenticated:', !!user, user?.role)
    
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      console.log('🔥 VEHICLE_API: Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('🔥 VEHICLE_API: Request data:', data)
    
    const errors = validateVehicleData(data)
    console.log('🔥 VEHICLE_API: Validation errors:', errors)
    
    if (errors.length > 0) {
      console.log('🔥 VEHICLE_API: Validation failed')
      return NextResponse.json({ errors }, { status: 400 })
    }

    console.log('🔥 VEHICLE_API: Checking existing vehicle...')
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        licensePlate: data.licensePlate,
        tenantId: user.tenantId
      }
    })

    if (existingVehicle) {
      console.log('🔥 VEHICLE_API: Duplicate license plate')
      return NextResponse.json(
        { error: 'Vehicle with this license plate already exists' },
        { status: 400 }
      )
    }

    console.log('🔥 VEHICLE_API: Creating vehicle in database...')
    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        tenantId: user.tenantId
      },
      include: {
        assignedDriver: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    console.log('🔥 VEHICLE_API: Vehicle created successfully:', vehicle.id)
    return NextResponse.json(vehicle)
  } catch (error) {
    console.error('🔥 VEHICLE_API: Error details:', error)
    console.error('🔥 VEHICLE_API: Error message:', error.message)
    console.error('🔥 VEHICLE_API: Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    console.log('🔥 VEHICLE_API: PUT request started')
    
    const user = await getCurrentUser(request)
    console.log('🔥 VEHICLE_API: User authenticated:', !!user, user?.role)
    
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      console.log('🔥 VEHICLE_API: Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract vehicle ID from URL
    const url = new URL(request.url)
    const vehicleId = url.pathname.split('/').pop()
    console.log('🔥 VEHICLE_API: Vehicle ID from URL:', vehicleId)

    const data = await request.json()
    console.log('🔥 VEHICLE_API: Update data:', data)

    // Verify vehicle belongs to user's tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        tenantId: user.tenantId
      }
    })

    if (!existingVehicle) {
      console.log('🔥 VEHICLE_API: Vehicle not found or unauthorized')
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    console.log('🔥 VEHICLE_API: Updating vehicle in database...')
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: data,
      include: {
        assignedDriver: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    console.log('🔥 VEHICLE_API: Vehicle updated successfully:', updatedVehicle.id)
    return NextResponse.json(updatedVehicle)
  } catch (error) {
    console.error('🔥 VEHICLE_API: PUT Error details:', error)
    console.error('🔥 VEHICLE_API: PUT Error message:', error.message)
    return NextResponse.json(
      { error: 'Failed to update vehicle' },
      { status: 500 }
    )
  }
}