import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_SESSION_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/access"

export async function requireAdminPageSession(nextTarget) {
  const cookieStore = await cookies()
  const adminSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || ""
  if (isValidAdminSessionToken(adminSessionToken)) {
    return
  }

  const loginUrl = new URL("/admin/login", "http://localhost")
  if (nextTarget) {
    loginUrl.searchParams.set("next", nextTarget)
  }
  redirect(`${loginUrl.pathname}${loginUrl.search}`)
}
