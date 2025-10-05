import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import '../styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'ParkPay - Smart Parking Payments',
  description: 'Revolutionary parking micropayments using XRPL + RLUSD and Echo AI insights',
  keywords: ['parking', 'micropayments', 'XRPL', 'RLUSD', 'blockchain', 'AI'],
  authors: [{ name: 'ParkPay Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0E0E10',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
