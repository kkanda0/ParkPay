/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_TOMTOM_API_KEY: 'MWH3UEN2Q9NTG4Amr7bjlUF1Luhjti6l',
    NEXT_PUBLIC_API_URL: 'http://localhost:4000/api',
  },
}

module.exports = nextConfig
