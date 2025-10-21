// src/app/api/admin/users/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const where = {
      ...(tenantId && { tenantId })
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Remove password from response
    const safeUsers = users.map(({ password, ...user }) => user)

    return NextResponse.json(safeUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { email, password, name, phone, role, tenantId } = data

    if (!email || !password || !name || !role || !tenantId) {
      return NextResponse.json(
        { error: 'Email, password, name, role, and tenant are required' },
        { status: 400 }
      )
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: { email, tenantId }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists in this tenant' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role,
        tenantId
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    // Remove password from response
    const { password: _, ...safeUser } = newUser

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}