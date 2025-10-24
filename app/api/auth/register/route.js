// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

export async function POST(request) {
  try {
    const { 
      email, 
      password, 
      name, 
      phone,
      companyName,
      companyAddress 
    } = await request.json()

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const tenantSlug = generateSlug(companyName)

    // Check if tenant slug exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    })

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Company name already taken' },
        { status: 400 }
      )
    }

    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug: tenantSlug,
          address: companyAddress,
          settings: {
            create: {
              currency: 'USD',
              timezone: 'UTC'
            }
          }
        }
      })

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone,
          role: 'ADMIN',
          tenantId: tenant.id
        },
        include: {
          tenant: true
        }
      })

      return { tenant, user }
    })

    const token = generateToken({
      userId: result.user.id,
      tenantId: result.user.tenantId,
      role: result.user.role
    })

    const { password: _, ...userWithoutPassword } = result.user

    return NextResponse.json({
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}