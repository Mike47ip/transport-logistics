// app\api\clients\[id]\route.js

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateClientData } from '@/lib/validation'

export async function GET(request, { params }) {
  try {
    console.log('👥 CLIENT_API: GET request for client:', params.id)
    
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      },
      include: {
        deliveries: {
          include: {
            driver: {
              select: { id: true, name: true }
            },
            vehicle: {
              select: { id: true, licensePlate: true, make: true, model: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      }
    })
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    console.log('👥 CLIENT_API: Found client:', client.name)
    return NextResponse.json(client)
    
  } catch (error) {
    console.error('👥 CLIENT_API: GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    console.log('👥 CLIENT_API: PUT request for client:', params.id)
    
    const body = await request.json()
    console.log('👥 CLIENT_API: Update data:', body)
    
    // Validate the data
    const errors = validateClientData(body)
    if (errors.length > 0) {
      console.log('👥 CLIENT_API: Validation errors:', errors)
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }
    
    // Check if client exists
    const existingClient = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      }
    })
    
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    // Check if email or phone is taken by another client
    const duplicateClient = await prisma.client.findFirst({
      where: {
        tenantId: user.tenantId,
        id: { not: params.id },
        OR: [
          { email: body.email },
          { phone: body.phone }
        ]
      }
    })
    
    if (duplicateClient) {
      return NextResponse.json(
        { error: 'Another client with this email or phone already exists' },
        { status: 400 }
      )
    }
    
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: body,
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
    
    console.log('👥 CLIENT_API: Client updated:', updatedClient.name)
    return NextResponse.json(updatedClient)
    
  } catch (error) {
    console.error('👥 CLIENT_API: PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    console.log('👥 CLIENT_API: DELETE request for client:', params.id)
    
    // Check if client exists and belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      },
      include: {
        deliveries: true
      }
    })
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }
    
    // Check if client has active deliveries
    const activeDeliveries = client.deliveries.filter(
      delivery => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(delivery.status)
    )
    
    if (activeDeliveries.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete client with ${activeDeliveries.length} active deliveries. Please complete or cancel them first.` 
        },
        { status: 400 }
      )
    }
    
    // Soft delete by deactivating instead of hard delete
    const deactivatedClient = await prisma.client.update({
      where: { id: params.id },
      data: { isActive: false }
    })
    
    console.log('👥 CLIENT_API: Client deactivated:', client.name)
    return NextResponse.json({ 
      message: 'Client deactivated successfully',
      client: deactivatedClient 
    })
    
  } catch (error) {
    console.error('👥 CLIENT_API: DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}