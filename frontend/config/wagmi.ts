import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { defineChain } from "viem";
import { avalancheFuji, hardhat } from "viem/chains";

/**
 * Definición oficial de HashKey Chain Testnet (HSK)
 * Utilizada por el contrato AltiPayEscrow (Chain ID 133)
 */
export const hskTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: {
    name: "HashKey Token",
    symbol: "HSK",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        "https://hashkeychain-testnet.alt.technology",
        "https://testnet-rpc.hsk.xyz"
      ],
    },
    public: {
      http: [
        "https://hashkeychain-testnet.alt.technology",
        "https://testnet-rpc.hsk.xyz"
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "HashKey Explorer",
      url: "https://hashkeychain-testnet-explorer.alt.technology",
    },
  },
  testnet: true,
});

/**
 * Configuración central de Wagmi para AltiPay Protocol
 * Compatible con Avalanche Fuji, HSK Testnet y Localhost
 */
export const config = getDefaultConfig({
  appName: "AltiPay Protocol",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "altipay_hackathon_demo_2026",
  chains: [hskTestnet, avalancheFuji, hardhat],
  transports: {
    [hskTestnet.id]: http("https://hashkeychain-testnet.alt.technology"),
    [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});
