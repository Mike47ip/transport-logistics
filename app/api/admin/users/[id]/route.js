// src/app/api/admin/users/[id]/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = params.id
    const data = await request.json()

    const updateData = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
      isActive: data.isActive
    }

    // Only hash password if it's being updated
    if (data.password) {
      updateData.password = await hashPassword(data.password)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true }
        }
      }
    })

    // Remove password from response
    const { password: _, ...safeUser } = updatedUser

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
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

    const userId = params.id

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'User deactivated successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}