import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken' // Only if token is JWT-based

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value
  const { pathname } = req.nextUrl

  const isProtectedRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/account')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  // 1️⃣ If user is NOT logged in → block protected routes
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 2️⃣ If user IS logged in → block auth routes (login/register)
  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 3️⃣ If token exists, check for expiry (only if JWT-based)
  if (token) {
    try {
      const decoded = jwt.decode(token) as { exp?: number }
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        // Token is expired → clear cookie & redirect to login
        const res = NextResponse.redirect(new URL('/login', req.url))
        res.cookies.delete('access_token')
        return res
      }
    } catch (e) {
      console.error('[middleware error]', e)
      const res = NextResponse.redirect(new URL('/login', req.url))
      res.cookies.delete('access_token')
      return res
    }
  }

  // ✅ Otherwise → let the request through
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/login',
    '/register',
  ],
}
