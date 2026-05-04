import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = { title: "HireAHuman - Admin", description: "Manage your team and bounties" }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ fontFamily: 'system-ui', margin: 0, padding: 0, background: '#0a0f1e', color: '#fff', minHeight: '100vh' }}>{children}</body></html>
}
