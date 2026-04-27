import { redirect } from "next/navigation"
import { requireAdminPageSession } from "@/lib/admin-page"

export default async function AdminLandingPage() {
  await requireAdminPageSession("/admin")
  redirect("/admin/orders")
}
