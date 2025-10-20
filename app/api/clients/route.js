// src/app/api/clients/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clients = await prisma.client.findMany({
      where: {
        tenantId: user.tenantId,
        isActive: true
      },
      include: {
        _count: {
          select: { deliveries: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(clients)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.name || !data.phone || !data.address) {
      return NextResponse.json(
        { error: 'Name, phone, and address are required' },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        ...data,
        tenantId: user.tenantId
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}