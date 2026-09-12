import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const rawKey = process.env.DEPLOYER_PRIVATE_KEY?.trim() || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const PRIVATE_KEY = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
const SNOWTRACE_API_KEY = process.env.SNOWTRACE_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // 🔴 Bounty Avalanche: Avalanche Fuji Testnet
    avalancheFuji: {
      url: process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [PRIVATE_KEY],
    },
    // 🟡 Bounty HSK Chain: HashKey Testnet
    hskTestnet: {
      url: process.env.HSK_TESTNET_RPC || "https://testnet.hsk.xyz",
      chainId: 133,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFuji: SNOWTRACE_API_KEY,
    },
    customChains: [
      {
        network: "avalancheFuji",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://testnet.snowtrace.io",
        },
      },
      {
        network: "hskTestnet",
        chainId: 133,
        urls: {
          apiURL: "https://testnet.hsk.xyz/api",
          browserURL: "https://testnet.hsk.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
