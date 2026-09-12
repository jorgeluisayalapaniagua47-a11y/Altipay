import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log(`\n🎁 [AltiPay Protocol] Distribuyendo MockUSDC en red: ${network.name}...`);

  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer / Funder: ${deployer.address}`);

  const usdcAddress =
    network.name === "avalancheFuji"
      ? process.env.USDC_FUJI_ADDRESS
      : process.env.USDC_HSK_ADDRESS;

  if (!usdcAddress || usdcAddress === ethers.ZeroAddress) {
    console.error(`❌ Dirección de MockUSDC no encontrada en .env para la red ${network.name}`);
    process.exit(1);
  }

  const MockUSDC = await ethers.getContractAt("MockUSDC", usdcAddress);

  // 👥 Wallets de los integrantes del equipo (Reemplazar con las direcciones reales de los compañeros)
  const teamWallets: { name: string; address: string }[] = [
    { name: "Jorge Ayala (DEV 2)", address: process.env.JORGE_WALLET || "0x9e1D25C3b9e4210B309A4D304aF96085a6B74f7A" },
    { name: "Eddy Galvan (DEV 3)", address: process.env.EDDY_WALLET || "0x2546BcD3c84621e976D8185a91A922aE77ECEc30" },
    { name: "Joseca (DEV 4)", address: process.env.JOSECA_WALLET || "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E" },
  ];

  const amountToMint = ethers.parseUnits("10000", 6); // 10,000 USDC a cada uno

  for (const member of teamWallets) {
    const formattedAddress = ethers.getAddress(member.address.toLowerCase());
    console.log(`\n💸 Enviando 10,000 MockUSDC a ${member.name} (${formattedAddress})...`);
    const tx = await MockUSDC.faucet(formattedAddress, amountToMint);
    await tx.wait();
    console.log(`✅ Tokens acreditados. TX Hash: ${tx.hash}`);
    const balance = await MockUSDC.balanceOf(formattedAddress);
    console.log(`💰 Saldo actual de ${member.name}: ${ethers.formatUnits(balance, 6)} USDC`);
  }

  console.log("\n🎉 ¡Distribución de fondos completada exitosamente!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
