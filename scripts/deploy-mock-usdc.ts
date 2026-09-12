import { ethers, network } from "hardhat";

async function main() {
  console.log(`\n🚀 [AltiPay Protocol] Desplegando MockUSDC en red: ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDCFactory.deploy();
  await usdc.waitForDeployment();

  const usdcAddress = await usdc.getAddress();
  console.log(`✅ MockUSDC desplegado exitosamente en: ${usdcAddress}`);
  console.log(`💰 Balance inicial del deployer: 1,000,000 USDC`);
  console.log(`\n📋 Guarda esta dirección en tu archivo .env:`);
  if (network.name === "avalancheFuji") {
    console.log(`USDC_FUJI_ADDRESS=${usdcAddress}`);
  } else if (network.name === "hskTestnet") {
    console.log(`USDC_HSK_ADDRESS=${usdcAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
