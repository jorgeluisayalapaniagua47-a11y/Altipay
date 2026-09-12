import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Web3Provider } from '@/components/web3/Web3Provider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Altipay — Pagos y Custodia Protegida para Bolivia',
  description: 'Protocolo descentralizado de custodia comercial (escrow) para compras y encomiendas entre La Paz, Cochabamba y Santa Cruz.',
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#080b0d',
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="bg-background">
      <body className="antialiased">
        <Web3Provider>
          {children}
          <Toaster richColors position="top-right" theme="dark" closeButton />
        </Web3Provider>
      </body>
    </html>
  )
}
