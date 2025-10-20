
// /app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password, tenantSlug } = await request.json()

    // Find user with tenant
    const user = await prisma.user.findFirst({
      where: {
        email,
        tenant: tenantSlug ? { slug: tenantSlug } : undefined
      },
      include: {
        tenant: true
      }
    })

    if (!user || !user.isActive || !user.tenant.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    })

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}