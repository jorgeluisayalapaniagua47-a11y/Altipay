import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log(`\n🚀 [AltiPay Protocol] Desplegando AltiPayEscrow en red: ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS || deployer.address;
  const vipLockAddress = process.env.UNLOCK_VIP_LOCK_ADDRESS || ethers.ZeroAddress;

  console.log(`💼 Fee Recipient: ${feeRecipient}`);
  console.log(`🔑 Unlock VIP Lock: ${vipLockAddress}`);

  const AltiPayEscrowFactory = await ethers.getContractFactory("AltiPayEscrow");
  const escrow = await AltiPayEscrowFactory.deploy(feeRecipient, vipLockAddress);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log(`✅ AltiPayEscrow desplegado exitosamente en: ${escrowAddress}`);

  console.log(`\n📋 Guarda esta dirección en tu archivo .env:`);
  if (network.name === "avalancheFuji") {
    console.log(`ESCROW_FUJI_ADDRESS=${escrowAddress}`);
  } else if (network.name === "hskTestnet") {
    console.log(`ESCROW_HSK_ADDRESS=${escrowAddress}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
