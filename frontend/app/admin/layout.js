import AdminSessionControls from "@/components/admin-session-controls"

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminSessionControls />
      {children}
    </>
  )
}
