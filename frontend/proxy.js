import { NextResponse } from "next/server"
import { hasValidAdminSessionRequest } from "@/lib/access"

function isPublicAdminPath(pathname) {
  return pathname === "/admin/login" || pathname === "/api/admin/login"
}

function isProtectedApiPath(pathname) {
  return pathname.startsWith("/api/")
}

function isProtectedAdminPath(pathname) {
  return pathname === "/admin" || pathname.startsWith("/admin/")
}

export function proxy(request) {
  const { pathname, search } = request.nextUrl

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next()
  }

  if (hasValidAdminSessionRequest(request)) {
    return NextResponse.next()
  }

  if (!isProtectedAdminPath(pathname) && !isProtectedApiPath(pathname)) {
    return NextResponse.next()
  }

  if (isProtectedApiPath(pathname)) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const loginUrl = new URL("/admin/login", request.url)
  const nextTarget = `${pathname}${search || ""}`
  if (pathname !== "/admin/login") {
    loginUrl.searchParams.set("next", nextTarget)
  }
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/rewrite/:path*",
    "/api/admin/:path*",
    "/api/audits/:path*",
    "/api/orders/deliver",
    "/api/orders/send-delivery",
    "/api/rewrites/:path*",
    "/api/rewrites/update",
    "/api/rewrites/pdf/:path*"
  ]
}
