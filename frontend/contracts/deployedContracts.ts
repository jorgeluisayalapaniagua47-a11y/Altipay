export const ALTI_PAY_ESCROW_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_feeRecipient", type: "address" },
      { internalType: "address", name: "_vipLock", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "address", name: "token", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "secretHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" },
      { indexed: false, internalType: "string", name: "description", type: "string" }
    ],
    name: "OrderCreated",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "string", name: "trackingInfo", type: "string" }
    ],
    name: "OrderDispatched",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "uint256", name: "netAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "fee", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "completedAt", type: "uint256" }
    ],
    name: "OrderCompleted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "refundedAt", type: "uint256" }
    ],
    name: "OrderRefunded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "OrderCancelled",
    type: "event"
  },
  {
    inputs: [
      { internalType: "address", name: "_seller", type: "address" },
      { internalType: "address", name: "_token", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "bytes32", name: "_secretHash", type: "bytes32" },
      { internalType: "uint256", name: "_deadline", type: "uint256" },
      { internalType: "string", name: "_description", type: "string" }
    ],
    name: "createOrder",
    outputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_orderId", type: "bytes32" },
      { internalType: "string", name: "_trackingInfo", type: "string" }
    ],
    name: "confirmDispatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_orderId", type: "bytes32" },
      { internalType: "bytes32", name: "_secret", type: "bytes32" }
    ],
    name: "confirmDeliveryWithSecret",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "_orderId", type: "bytes32" }],
    name: "claimRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "_orderId", type: "bytes32" }],
    name: "cancelOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "_orderId", type: "bytes32" }],
    name: "getOrder",
    outputs: [
      {
        components: [
          { internalType: "address", name: "buyer", type: "address" },
          { internalType: "address", name: "seller", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bytes32", name: "secretHash", type: "bytes32" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint8", name: "status", type: "uint8" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "trackingInfo", type: "string" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "completedAt", type: "uint256" }
        ],
        internalType: "struct IAltiPayEscrow.Order",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserOrders",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserOrderCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "BASE_FEE_BPS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "vipLock",
    outputs: [{ internalType: "contract IUnlockLock", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const

export const MOCK_USDC_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "pure",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const

export const UNLOCK_LOCK_ABI = [
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getHasValidKey",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const

export type ChainContractConfig = {
  name: string
  chainId: number
  escrowAddress: `0x${string}`
  usdcAddress: `0x${string}`
  explorerUrl: string
}

export const DEPLOYED_CONTRACTS: Record<number, ChainContractConfig> = {
  // Avalanche Fuji Testnet
  43113: {
    name: "Avalanche Fuji",
    chainId: 43113,
    escrowAddress: "0xC7d4d9a5708185761DDb65e014a0691C1f99679A",
    usdcAddress: "0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C",
    explorerUrl: "https://testnet.snowtrace.io"
  },
  // HashKey Chain Testnet
  133: {
    name: "HashKey Testnet",
    chainId: 133,
    escrowAddress: "0xC7d4d9a5708185761DDb65e014a0691C1f99679A",
    usdcAddress: "0xAe9F9d28E0Ba5Ea67dE0F3C82dc7e7215b6c855C",
    explorerUrl: "https://hashkey.blockscout.com"
  },
  // Hardhat Local Node
  31337: {
    name: "Hardhat Local",
    chainId: 31337,
    escrowAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    usdcAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    explorerUrl: "http://localhost:8545"
  }
}

export const DEFAULT_CHAIN_ID = 43113
