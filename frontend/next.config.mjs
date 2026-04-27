/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@aws-sdk/client-sesv2",
    "better-sqlite3",
    "mammoth",
    "pdf-parse",
    "pdf-lib"
  ]
}

export default nextConfig
