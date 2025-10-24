// src/app/api/admin/tenants/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    
    // Only SUPER_ADMIN can access this
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, isActive: true }
        },
        _count: {
          select: {
            users: true,
            vehicles: true,
            deliveries: true,
            clients: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    
    // Only SUPER_ADMIN can create tenants
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { name, domain, email, phone, address } = data

    if (!name) {
      return NextResponse.json(
        { error: 'Tenant name is required' },
        { status: 400 }
      )
    }

    const slug = generateSlug(name)

    // Check if tenant slug or domain already exists
    const existingTenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug },
          ...(domain ? [{ domain }] : [])
        ]
      }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant with this name or domain already exists' },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        domain: domain || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        settings: {
          create: {
            currency: 'USD',
            timezone: 'UTC',
            pricePerKm: 0.0,
            pricePerHour: 0.0,
            fuelSurcharge: 0.0
          }
        }
      },
      include: {
        settings: true,
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
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    )
  }
}