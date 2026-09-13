'use client'

import React, { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { config } from '@/config/wagmi'
import '@rainbow-me/rainbowkit/styles.css'

// Filter Reown cloud allowlist warning from triggering Next.js dev error overlay
if (typeof window !== 'undefined') {
  const origError = console.error
  console.error = (...args: any[]) => {
    const isAllowlistError = args.some((arg) => {
      const text = arg instanceof Error ? `${arg.message} ${arg.stack || ''}` : String(arg || '')
      return text.includes('cloud.reown.com') || text.includes('Allowlist') || text.includes('allowlist')
    })
    if (isAllowlistError) {
      console.warn('[WalletConnect / Reown Notice]: Allowlist warning suppressed in local development.')
      return
    }
    origError(...args)
  }

  window.addEventListener('error', (event) => {
    const msg = event.message || (event.error && event.error.message) || ''
    if (msg.includes('cloud.reown.com') || msg.includes('Allowlist') || msg.includes('allowlist')) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg = reason instanceof Error ? reason.message : String(reason || '')
    if (msg.includes('cloud.reown.com') || msg.includes('Allowlist') || msg.includes('allowlist')) {
      event.preventDefault()
    }
  })
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#66e3d0',
            accentColorForeground: '#06100f',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
