import "./globals.css"
import { IBM_Plex_Mono, Playfair_Display } from "next/font/google"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"]
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "700"],
  style: ["normal", "italic"]
})

export const metadata = {
  title: "RunTime Resume",
  description: "Specialist resume review and rewriting for hardware engineers.",
  icons: {
    icon: "/favicon.svg"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${plexMono.variable} ${playfair.variable}`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
