import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

export async function GET(request) {
  try {
    console.log('🚗 DRIVERS_API: GET request started')
    
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🚗 DRIVERS_API: User authenticated:', user.role)

    const drivers = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        role: 'DRIVER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        assignedVehicles: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true,
            status: true
          }
        },
        deliveries: {
          where: {
            status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
          },
          select: {
            id: true,
            trackingNumber: true,
            status: true,
            client: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('🚗 DRIVERS_API: Found drivers count:', drivers.length)
    return NextResponse.json(drivers)
  } catch (error) {
    console.error('🚗 DRIVERS_API: Error fetching drivers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('🚗 DRIVERS_API: POST request started')
    
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      console.log('🚗 DRIVERS_API: Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('🚗 DRIVERS_API: Request data:', { ...data, password: '***hidden***' })

    // Validate required fields
    if (!data.name || !data.email || !data.password) {
      console.log('🚗 DRIVERS_API: Missing required fields')
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if driver already exists in this tenant
    console.log('🚗 DRIVERS_API: Checking existing driver...')
    const existingDriver = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: user.tenantId
      }
    })

    if (existingDriver) {
      console.log('🚗 DRIVERS_API: Driver already exists')
      return NextResponse.json(
        { error: 'Driver with this email already exists' },
        { status: 400 }
      )
    }

    console.log('🚗 DRIVERS_API: Hashing password...')
    const hashedPassword = await hashPassword(data.password)

    console.log('🚗 DRIVERS_API: Creating driver in database...')
    const driver = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        role: 'DRIVER',
        tenantId: user.tenantId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log('🚗 DRIVERS_API: Driver created successfully:', driver.id)
    return NextResponse.json(driver)
  } catch (error) {
    console.error('🚗 DRIVERS_API: Error details:', error)
    console.error('🚗 DRIVERS_API: Error message:', error.message)
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    )
  }
}