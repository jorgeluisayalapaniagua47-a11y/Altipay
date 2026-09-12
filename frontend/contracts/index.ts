import { deployedContracts } from "./deployedContracts";

// Direcciones de fallback desplegadas por Luis Sandoval (DEV 1) en HSK Testnet
export const DEFAULT_HSK_ESCROW = "0xC7d4d9a5708185761DDb65e014a0691C1f99679A";
export const DEFAULT_HSK_MOCK_USDC = "0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C";

// Direcciones para Avalanche Fuji (Testnet)
export const DEFAULT_FUJI_ESCROW = "0x0000000000000000000000000000000000000000";
export const DEFAULT_FUJI_MOCK_USDC = "0x0000000000000000000000000000000000000000";

// ABI extraído de deployedContracts para AltiPayEscrow
export const ALTIPAY_ESCROW_ABI = (deployedContracts["133"] as any)?.AltiPayEscrow?.abi || [];

// ABI estándar ERC-20 para MockUSDC / USDC
export const ERC20_ABI = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function getEscrowContractConfig(chainId?: number) {
  const currentChainId = chainId || 133;
  const chainData = (deployedContracts as any)[currentChainId.toString()];

  if (chainData?.AltiPayEscrow?.address && chainData.AltiPayEscrow.address !== "0x0000000000000000000000000000000000000000") {
    return {
      address: chainData.AltiPayEscrow.address as `0x${string}`,
      abi: chainData.AltiPayEscrow.abi,
    };
  }

  // Fallback por defecto en HSK
  return {
    address: DEFAULT_HSK_ESCROW as `0x${string}`,
    abi: ALTIPAY_ESCROW_ABI,
  };
}

export function getUSDCContractAddress(chainId?: number): `0x${string}` {
  if (chainId === 43113) {
    return DEFAULT_FUJI_MOCK_USDC as `0x${string}`;
  }
  return DEFAULT_HSK_MOCK_USDC as `0x${string}`;
}
