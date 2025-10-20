// /middleware.js
import { NextResponse } from 'next/server'
import { getCurrentUser } from './lib/auth'

export async function middleware(request) {
  // Skip auth for public routes
  const publicRoutes = ['/login', '/register', '/api/auth']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const user = await getCurrentUser(request)
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Add user info to headers for API routes
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-tenant-id', user.tenantId)
  response.headers.set('x-user-role', user.role)
  
  return response
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)',
  ],
}