import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { avalancheFuji, hardhat } from 'wagmi/chains'
import { defineChain } from 'viem'

export const hashKeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HashKey EcoPoints',
    symbol: 'HSK',
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://hashkeychain-testnet.alt.technology'] },
    public: { http: [process.env.NEXT_PUBLIC_HSK_RPC_URL || 'https://hashkeychain-testnet.alt.technology'] },
  },
  blockExplorers: {
    default: { name: 'HashKey Explorer', url: 'https://hashkey.blockscout.com' },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'AltiPay Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f168fa2d00',
  chains: [avalancheFuji, hashKeyTestnet, hardhat],
  ssr: true,
})
