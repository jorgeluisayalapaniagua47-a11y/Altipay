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
  console.error = (...args) => {
    const first = args[0]
    if (typeof first === 'string' && (first.includes('cloud.reown.com') || first.includes('not found on Allowlist'))) {
      console.warn('[WalletConnect / Reown Notice]:', ...args)
      return
    }
    origError(...args)
  }
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
