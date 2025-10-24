// app/lib/auth.js
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

export async function hashPassword(password) {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function getCurrentUser(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    
    if (!decoded) return null

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tenant: true
      }
    })

    return user
  } catch (error) {
    return null
  }
}

// Client-side auth check utility
export function checkClientAuth() {
  if (typeof window === 'undefined') return null
  
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  
  if (!token || !userData) {
    return null
  }
  
  try {
    return JSON.parse(userData)
  } catch {
    return null
  }
}