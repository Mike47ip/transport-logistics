// src/app/api/admin/tenants/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id
    const data = await request.json()

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        domain: data.domain || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        isActive: data.isActive
      },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            deliveries: true,
            clients: true
          }
        }
      }
    })

    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id

    // Soft delete - just deactivate
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Tenant deactivated successfully' })
  } catch (error) {
    console.error('Error deleting tenant:', error)
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    )
  }
}