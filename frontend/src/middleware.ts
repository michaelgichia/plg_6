import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import jwt from 'jsonwebtoken'
export function middleware(req: NextRequest) {
  try {
    const token = req.cookies.get('access_token')?.value
    const {pathname} = req.nextUrl

    const isProtectedRoute =
      pathname.startsWith('/dashboard') || pathname.startsWith('/account')
    const isAuthRoute =
      pathname.startsWith('/login') || pathname.startsWith('/register')

    if (!token && isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (token && isAuthRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (token) {
      try {
        const decoded = jwt.decode(token) as {exp?: number}
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
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

    return NextResponse.next()
  } catch {
    return new Response('middleware error', {status: 500})
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/login', '/register'],
}
