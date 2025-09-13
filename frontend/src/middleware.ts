// middleware.ts
import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value

  // If no token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If it's a JWT, decode & check expiry
  try {
    const decoded = jwt.decode(token) as {exp?: number}
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      // Token is expired → clear cookie & redirect
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
}
