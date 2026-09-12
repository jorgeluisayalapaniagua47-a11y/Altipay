import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * 🧪 AltiPay Protocol — TK-JORGE-08: E2E Happy Path Transactional Test
 * Simula de punta a punta el flujo comercial entre Bolivia Comprador y Vendedor
 */
async function main() {
  console.log("\n================================================================================");
  console.log("🚀 [TK-JORGE-08] INICIANDO PRUEBA TRANSACCIONAL E2E: HAPPY PATH COMPLETO");
  console.log("================================================================================\n");

  const [deployer, buyer, seller, feeRecipient] = await ethers.getSigners();

  console.log(`👤 Comprador (Jorge / Wallet A):  ${buyer.address}`);
  console.log(`👤 Vendedor  (Joseca / Wallet B): ${seller.address}`);
  console.log(`🏦 Fee Recipient (Protocolo):     ${feeRecipient.address}\n`);

  // 1. Despliegue de contratos para la prueba E2E
  console.log("📦 1. Desplegando contratos AltiPay...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`   ✅ MockUSDC desplegado en:    ${usdcAddress}`);

  const MockUnlock = await ethers.getContractFactory("MockUnlockLock");
  const mockUnlock = await MockUnlock.deploy();
  await mockUnlock.waitForDeployment();
  const unlockAddress = await mockUnlock.getAddress();
  console.log(`   ✅ MockUnlockLock en:         ${unlockAddress}`);

  const AltiPayEscrow = await ethers.getContractFactory("AltiPayEscrow");
  const escrow = await AltiPayEscrow.deploy(feeRecipient.address, unlockAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`   ✅ AltiPayEscrow en:          ${escrowAddress}\n`);

  // 2. Fondeo de USDC mediante Faucet
  console.log("💸 2. Wallet A solicita 500 MockUSDC desde el Faucet...");
  const faucetAmount = ethers.parseUnits("500", 6);
  const faucetTx = await usdc.faucet(buyer.address, faucetAmount);
  await faucetTx.wait();
  const buyerBalance = await usdc.balanceOf(buyer.address);
  console.log(`   ✅ Saldo de Wallet A: ${ethers.formatUnits(buyerBalance, 6)} USDC (TX: ${faucetTx.hash})\n`);

  // 3. Aprobación (Allowance) de USDC
  const orderAmount = ethers.parseUnits("150", 6);
  console.log(`🔐 3. Wallet A aprueba ${ethers.formatUnits(orderAmount, 6)} USDC al contrato Escrow...`);
  const approveTx = await usdc.connect(buyer).approve(escrowAddress, orderAmount);
  await approveTx.wait();
  const allowance = await usdc.allowance(buyer.address, escrowAddress);
  console.log(`   ✅ Allowance confirmado: ${ethers.formatUnits(allowance, 6)} USDC (TX: ${approveTx.hash})\n`);

  // 4. Creación de Orden con Secreto Criptográfico
  const SECRET_PIN = "749201";
  const SECRET_BYTES32 = ethers.encodeBytes32String(SECRET_PIN);
  const SECRET_HASH = ethers.keccak256(ethers.solidityPacked(["bytes32"], [SECRET_BYTES32]));
  const DEADLINE_HOURS = 48n;
  const deadline = BigInt(Math.floor(Date.now() / 1000)) + DEADLINE_HOURS * 3600n;
  const DESCRIPTION = "Repuestos de camión - Oruro a Cochabamba";

  console.log("📝 4. Wallet A crea la custodia condicional en /create:");
  console.log(`   - PIN Secreto:        ${SECRET_PIN}`);
  console.log(`   - SecretHash on-chain: ${SECRET_HASH}`);
  console.log(`   - Descripción:        ${DESCRIPTION}`);
  console.log(`   - Monto:              150.00 USDC`);

  const createTx = await escrow.connect(buyer).createOrder(
    seller.address,
    usdcAddress,
    orderAmount,
    SECRET_HASH,
    deadline,
    DESCRIPTION
  );
  const createReceipt = await createTx.wait();

  // Extracción del Order ID emitido en el evento
  let orderId: string = "";
  for (const log of createReceipt?.logs || []) {
    try {
      const parsed = escrow.interface.parseLog(log);
      if (parsed?.name === "OrderCreated") {
        orderId = parsed.args[0];
        break;
      }
    } catch {}
  }

  console.log(`   ✅ Custodia creada exitosamente!`);
  console.log(`   🔑 Order ID Oficial: ${orderId}`);
  console.log(`   ⛓️ TX Hash:          ${createTx.hash}\n`);

  // Verificar estado de orden on-chain
  let orderData = await escrow.getOrder(orderId);
  console.log(`🔍 5. Verificando estado on-chain de la orden:`);
  console.log(`   - Comprador:  ${orderData.buyer}`);
  console.log(`   - Vendedor:   ${orderData.seller}`);
  console.log(`   - Estado:     ${orderData.status} (1 = FUNDED / Depósito Garantizado)`);
  console.log(`   - Saldo Escrow: ${ethers.formatUnits(await usdc.balanceOf(escrowAddress), 6)} USDC\n`);

  // 6. Vendedor registra despacho en /seller
  const TRACKING_GUIDE = "Flota Bolívar Guía #90214";
  console.log(`🚚 6. Wallet B (Vendedor) despacha mercadería en /seller:`);
  console.log(`   - Guía de Transporte: ${TRACKING_GUIDE}`);
  const dispatchTx = await escrow.connect(seller).confirmDispatch(orderId, TRACKING_GUIDE);
  await dispatchTx.wait();
  console.log(`   ✅ Despacho confirmado on-chain.`);
  console.log(`   ⛓️ TX Hash: ${dispatchTx.hash}\n`);

  orderData = await escrow.getOrder(orderId);
  console.log(`   - Estado actualizado: ${orderData.status} (2 = DISPATCHED)`);
  console.log(`   - Guía on-chain:       "${orderData.trackingInfo}"\n`);

  // 7. Comprador libera los fondos en /order/[id] con su PIN
  console.log(`🔓 7. Wallet A recibe mercadería en terminal de buses y valida PIN "${SECRET_PIN}":`);
  const sellerBalBefore = await usdc.balanceOf(seller.address);
  const feeBalBefore = await usdc.balanceOf(feeRecipient.address);

  const releaseTx = await escrow.connect(buyer).confirmDeliveryWithSecret(orderId, SECRET_BYTES32);
  await releaseTx.wait();
  console.log(`   ✅ Fondos liberados atómicamente!`);
  console.log(`   ⛓️ TX Hash: ${releaseTx.hash}\n`);

  orderData = await escrow.getOrder(orderId);
  const sellerBalAfter = await usdc.balanceOf(seller.address);
  const feeBalAfter = await usdc.balanceOf(feeRecipient.address);

  const sellerReceived = sellerBalAfter - sellerBalBefore;
  const feeReceived = feeBalAfter - feeBalBefore;

  console.log("📊 8. Balance Final de Liquidación:");
  console.log(`   - Estado de la Orden:      ${orderData.status} (3 = COMPLETED)`);
  console.log(`   - Acreditado a Vendedor:   ${ethers.formatUnits(sellerReceived, 6)} USDC (99.5%)`);
  console.log(`   - Comisión de Protocolo:   ${ethers.formatUnits(feeReceived, 6)} USDC (0.5% Base Fee)`);
  console.log(`   - Balance remanente Escrow: ${ethers.formatUnits(await usdc.balanceOf(escrowAddress), 6)} USDC\n`);

  console.log("================================================================================");
  console.log("🎉 [TK-JORGE-08] PRUEBA E2E FINALIZADA CON ÉXITO: 100% HAPPY PATH VALIDADO");
  console.log("================================================================================\n");

  console.log("📋 Resumen para Devfolio Submission & Pitch Slides:");
  console.log(`- Contract Escrow:   ${escrowAddress}`);
  console.log(`- Token USDC:        ${usdcAddress}`);
  console.log(`- TX Faucet Mint:    ${faucetTx.hash}`);
  console.log(`- TX Approve Escrow: ${approveTx.hash}`);
  console.log(`- TX Create Order:   ${createTx.hash}`);
  console.log(`- TX Dispatch Order: ${dispatchTx.hash}`);
  console.log(`- TX Release Funds:  ${releaseTx.hash}`);
  console.log(`- Order ID (bytes32): ${orderId}\n`);
}

main().catch((error) => {
  console.error("❌ Error en la prueba E2E:", error);
  process.exitCode = 1;
});
