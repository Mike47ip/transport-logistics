// app/api/auth/login/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request) {
  console.log('🚀 LOGIN API HIT - Starting login process')
  
  try {
    const { email, password, tenantSlug } = await request.json()
    console.log('📧 Login attempt for email:', email)
    console.log('🏢 Tenant slug:', tenantSlug || 'none provided')

    // Find user with tenant
    console.log('🔍 Searching for user in database...')
    const user = await prisma.user.findFirst({
      where: {
        email,
        tenant: tenantSlug ? { slug: tenantSlug } : undefined
      },
      include: {
        tenant: true
      }
    })

    console.log('👤 User found:', user ? 'YES' : 'NO')
    if (user) {
      console.log('📋 User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        tenantName: user.tenant?.name,
        tenantActive: user.tenant?.isActive
      })
    }

    if (!user || !user.isActive || !user.tenant?.isActive) {
      console.log('❌ Login failed - User not found, inactive, or tenant inactive')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('🔐 Verifying password...')
    const isValidPassword = await verifyPassword(password, user.password)
    console.log('🔑 Password valid:', isValidPassword ? 'YES' : 'NO')

    if (!isValidPassword) {
      console.log('❌ Login failed - Invalid password')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('🎫 Generating JWT token...')
    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role
    })
    console.log('✅ Token generated successfully')

    const { password: _, ...userWithoutPassword } = user
    
    console.log('🎉 LOGIN SUCCESS - Sending response')
    return NextResponse.json({
      token,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('💥 LOGIN ERROR:', error)
    console.error('📍 Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}