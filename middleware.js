// middleware.js
import { NextResponse } from 'next/server'

export async function middleware(request) {
  console.log('🔍 MIDDLEWARE: Processing request for:', request.nextUrl.pathname)
  
  // Define public routes that don't need authentication
  const publicRoutes = ['/login', '/register']
  const apiAuthRoutes = ['/api/auth']
  
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isApiAuthRoute = apiAuthRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // Allow public routes and auth API routes
  if (isPublicRoute || isApiAuthRoute) {
    console.log('✅ MIDDLEWARE: Public route, allowing access')
    return NextResponse.next()
  }

  // For API routes (except auth), check for token in Authorization header
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      console.log('❌ MIDDLEWARE: No token in API request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // For API routes, we'll let them handle their own token validation
    console.log('✅ MIDDLEWARE: API route with token, allowing')
    return NextResponse.next()
  }
  
  // For page routes (/admin, /dashboard, etc.), let client-side handle auth
  // This is crucial - we don't check auth here for pages because:
  // 1. Tokens are in localStorage (client-side only)
  // 2. Client-side routing handles the auth check
  console.log('✅ MIDDLEWARE: Page route, letting client-side handle auth')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}