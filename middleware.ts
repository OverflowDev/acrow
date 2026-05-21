import { NextRequest, NextResponse } from 'next/server'

// Edge middleware — runs before any page code executes.
// The arbitrator route is blocked unless the request comes from internal Next.js navigation
// (i.e. a client-side router push, not a direct URL visit or external link).
// Direct visits get a 404 response so the route is not discoverable by scanners or crawlers.
// The real security gate is still the on-chain arbitrator check + signature verification inside the page.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/app/arbitrator')) {
    const referer  = req.headers.get('referer')  || ''
    const host     = req.headers.get('host')     || ''
    const xNextNav = req.headers.get('x-nextjs-data') // set on client-side navigations

    const isInternalNav = xNextNav !== null || (referer && referer.includes(host))

    // Block and return 404 for direct URL visits / external referrers / crawlers
    if (!isInternalNav) {
      return new NextResponse(null, { status: 404 })
    }

    // For internal navigations, add headers to prevent indexing and caching
    const res = NextResponse.next()
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/arbitrator/:path*'],
}
