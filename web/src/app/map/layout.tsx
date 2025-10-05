'use client'

import { EchoProvider } from '@merit-systems/echo-react-sdk'

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EchoProvider config={{ 
      appId: '8aa15208-2fc9-4565-b397-57e5da728925',
      apiKey: '8aa15208-2fc9-4565-b397-57e5da728925'
    }}>
      {children}
    </EchoProvider>
  )
}
