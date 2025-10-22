// app\api\clients\route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { validateClientData } from '@/lib/validation'

export async function GET(request) {
  try {
    console.log('👥 CLIENTS_API: GET request received')
    
    const user = await getCurrentUser(request)
    if (!user) {
      console.log('👥 CLIENTS_API: No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('👥 CLIENTS_API: User found:', user.name, 'Tenant:', user.tenantId)
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    
    // Build where clause
    const where = {
      tenantId: user.tenantId
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { address: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status && status !== 'ALL') {
      where.isActive = status === 'ACTIVE'
    }
    
    const clients = await prisma.client.findMany({
      where,
      include: {
        deliveries: {
          select: {
            id: true,
            status: true,
            trackingNumber: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log('👥 CLIENTS_API: Found clients:', clients.length)
    return NextResponse.json(clients)
    
  } catch (error) {
    console.error('👥 CLIENTS_API: GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    console.log('👥 CLIENTS_API: POST request received')
    
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      console.log('👥 CLIENTS_API: Authorization failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    console.log('👥 CLIENTS_API: Request body:', body)
    
    // Validate the data
    const errors = validateClientData(body)
    if (errors.length > 0) {
      console.log('👥 CLIENTS_API: Validation errors:', errors)
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }
    
    // Check if client with same email or phone already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        tenantId: user.tenantId,
        OR: [
          { email: body.email },
          { phone: body.phone }
        ]
      }
    })
    
    if (existingClient) {
      return NextResponse.json(
        { error: 'Client with this email or phone already exists' },
        { status: 400 }
      )
    }
    
    const client = await prisma.client.create({
      data: {
        ...body,
        tenantId: user.tenantId,
        isActive: true
      },
      include: {
        deliveries: {
          select: {
            id: true,
            status: true,
            trackingNumber: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      }
    })
    
    console.log('👥 CLIENTS_API: Client created:', client.id)
    return NextResponse.json(client, { status: 201 })
    
  } catch (error) {
    console.error('👥 CLIENTS_API: POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create client', details: error.message },
      { status: 500 }
    )
  }
}