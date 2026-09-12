import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { AltiPayEscrow, MockUSDC, MockUnlockLock } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AltiPayEscrow Protocol — Suite de Pruebas Unitarias", function () {
  let escrow: AltiPayEscrow;
  let usdc: MockUSDC;
  let mockUnlock: MockUnlockLock;

  let owner: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let feeRecipient: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const DECIMALS = 6;
  const INITIAL_BUYER_BALANCE = ethers.parseUnits("1000", DECIMALS);
  const ORDER_AMOUNT = ethers.parseUnits("150", DECIMALS);

  // Secreto y Hash criptográfico
  const SECRET_STRING = "PIN_BOLIVIA_784920";
  const SECRET_BYTES32 = ethers.encodeBytes32String(SECRET_STRING);
  const SECRET_HASH = ethers.keccak256(ethers.solidityPacked(["bytes32"], [SECRET_BYTES32]));

  beforeEach(async function () {
    [owner, buyer, seller, feeRecipient, stranger] = await ethers.getSigners();

    // 1. Desplegar MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDCFactory.deploy();
    await usdc.waitForDeployment();

    // 2. Desplegar MockUnlockLock
    const MockUnlockLockFactory = await ethers.getContractFactory("MockUnlockLock");
    mockUnlock = await MockUnlockLockFactory.deploy();
    await mockUnlock.waitForDeployment();

    // 3. Desplegar AltiPayEscrow
    const AltiPayEscrowFactory = await ethers.getContractFactory("AltiPayEscrow");
    escrow = await AltiPayEscrowFactory.deploy(
      feeRecipient.address,
      await mockUnlock.getAddress()
    );
    await escrow.waitForDeployment();

    // 4. Fondear al comprador y aprobar al contrato Escrow
    await usdc.faucet(buyer.address, INITIAL_BUYER_BALANCE);
    await usdc.connect(buyer).approve(await escrow.getAddress(), ethers.MaxUint256);
  });

  describe("1. Inicialización y Configuración", function () {
    it("Debe configurar correctamente feeRecipient y vipLock", async function () {
      expect(await escrow.feeRecipient()).to.equal(feeRecipient.address);
      expect(await escrow.vipLock()).to.equal(await mockUnlock.getAddress());
      expect(await escrow.BASE_FEE_BPS()).to.equal(50n); // 0.5%
    });

    it("Solo el owner puede actualizar feeRecipient y vipLock", async function () {
      await expect(
        escrow.connect(stranger).setFeeRecipient(stranger.address)
      ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");

      await escrow.connect(owner).setFeeRecipient(stranger.address);
      expect(await escrow.feeRecipient()).to.equal(stranger.address);
    });
  });

  describe("2. Creación de Órdenes (createOrder)", function () {
    it("Happy Path: Crea y fondea la orden transfiriendo tokens al escrow", async function () {
      const deadline = (await time.latest()) + 3600 * 72; // 72 horas

      const tx = await escrow.connect(buyer).createOrder(
        seller.address,
        await usdc.getAddress(),
        ORDER_AMOUNT,
        SECRET_HASH,
        deadline,
        "Repuestos Toyota Hilux - La Cancha Cochabamba"
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Verificar que el saldo del comprador disminuyó y el del escrow aumentó
      expect(await usdc.balanceOf(buyer.address)).to.equal(INITIAL_BUYER_BALANCE - ORDER_AMOUNT);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(ORDER_AMOUNT);

      // Verificar que la orden esté en estado FUNDED (1)
      const userOrders = await escrow.getUserOrders(buyer.address);
      expect(userOrders.length).to.equal(1);
      const orderId = userOrders[0];

      const order = await escrow.getOrder(orderId);
      expect(order.buyer).to.equal(buyer.address);
      expect(order.seller).to.equal(seller.address);
      expect(order.amount).to.equal(ORDER_AMOUNT);
      expect(order.status).to.equal(1n); // FUNDED
      expect(order.secretHash).to.equal(SECRET_HASH);
    });

    it("Rechaza si el vendedor es dirección zero o igual al comprador", async function () {
      const deadline = (await time.latest()) + 3600 * 24;

      await expect(
        escrow.connect(buyer).createOrder(
          ethers.ZeroAddress,
          await usdc.getAddress(),
          ORDER_AMOUNT,
          SECRET_HASH,
          deadline,
          "Test"
        )
      ).to.be.revertedWith("Invalid seller address");

      await expect(
        escrow.connect(buyer).createOrder(
          buyer.address,
          await usdc.getAddress(),
          ORDER_AMOUNT,
          SECRET_HASH,
          deadline,
          "Test"
        )
      ).to.be.revertedWith("Buyer cannot be seller");
    });

    it("Rechaza si el deadline está en el pasado", async function () {
      const pastDeadline = (await time.latest()) - 100;

      await expect(
        escrow.connect(buyer).createOrder(
          seller.address,
          await usdc.getAddress(),
          ORDER_AMOUNT,
          SECRET_HASH,
          pastDeadline,
          "Test"
        )
      ).to.be.revertedWith("Deadline must be in future");
    });
  });

  describe("3. Despacho de Mercadería (confirmDispatch)", function () {
    let orderId: string;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 3600 * 72;
      await escrow.connect(buyer).createOrder(
        seller.address,
        await usdc.getAddress(),
        ORDER_AMOUNT,
        SECRET_HASH,
        deadline,
        "Carga Textil La Paz -> Cochabamba"
      );
      const orders = await escrow.getUserOrders(buyer.address);
      orderId = orders[0];
    });

    it("Vendedor puede confirmar despacho con número de guía", async function () {
      await expect(
        escrow.connect(seller).confirmDispatch(orderId, "Flota Bolivar Guia #84920")
      )
        .to.emit(escrow, "OrderDispatched")
        .withArgs(orderId, seller.address, "Flota Bolivar Guia #84920");

      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(2n); // DISPATCHED
      expect(order.trackingInfo).to.equal("Flota Bolivar Guia #84920");
    });

    it("Rechaza si alguien que no sea el vendedor intenta despachar", async function () {
      await expect(
        escrow.connect(stranger).confirmDispatch(orderId, "Guia Fake")
      ).to.be.revertedWith("Only seller can dispatch");
    });
  });

  describe("4. Liberación de Fondos con Secreto (confirmDeliveryWithSecret)", function () {
    let orderId: string;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 3600 * 72;
      await escrow.connect(buyer).createOrder(
        seller.address,
        await usdc.getAddress(),
        ORDER_AMOUNT,
        SECRET_HASH,
        deadline,
        "Repuestos Maquinaria"
      );
      const orders = await escrow.getUserOrders(buyer.address);
      orderId = orders[0];

      // Vendedor despacha
      await escrow.connect(seller).confirmDispatch(orderId, "Flota El Dorado #3321");
    });

    it("Comprador libera fondos con el PIN correcto (Cobro de 0.5% base fee)", async function () {
      const sellerInitialBal = await usdc.balanceOf(seller.address);
      const feeInitialBal = await usdc.balanceOf(feeRecipient.address);

      // Liberar con el secreto exacto
      await escrow.connect(buyer).confirmDeliveryWithSecret(orderId, SECRET_BYTES32);

      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(3n); // COMPLETED

      // Cálculo de comisión: 150 * 50 / 10000 = 0.75 USDC
      const expectedFee = (ORDER_AMOUNT * 50n) / 10000n;
      const expectedNet = ORDER_AMOUNT - expectedFee;

      expect(await usdc.balanceOf(seller.address)).to.equal(sellerInitialBal + expectedNet);
      expect(await usdc.balanceOf(feeRecipient.address)).to.equal(feeInitialBal + expectedFee);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
    });

    it("Exención de comisión VIP: Si el comprador posee Unlock VIP Key paga 0% fee", async function () {
      // Activar membresía VIP en el mock
      await mockUnlock.setHasValidKey(buyer.address, true);

      const sellerInitialBal = await usdc.balanceOf(seller.address);
      const feeInitialBal = await usdc.balanceOf(feeRecipient.address);

      await escrow.connect(buyer).confirmDeliveryWithSecret(orderId, SECRET_BYTES32);

      // Vendedor recibe el 100% exacto sin deducciones
      expect(await usdc.balanceOf(seller.address)).to.equal(sellerInitialBal + ORDER_AMOUNT);
      expect(await usdc.balanceOf(feeRecipient.address)).to.equal(feeInitialBal); // No hay fee
    });

    it("Rechaza si el secreto es incorrecto", async function () {
      const WRONG_SECRET = ethers.encodeBytes32String("PIN_ERRONEO_999999");

      await expect(
        escrow.connect(buyer).confirmDeliveryWithSecret(orderId, WRONG_SECRET)
      ).to.be.revertedWith("Invalid secret code");

      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(2n); // Sigue en DISPATCHED
    });

    it("Rechaza si alguien que no sea el comprador intenta liberar", async function () {
      await expect(
        escrow.connect(stranger).confirmDeliveryWithSecret(orderId, SECRET_BYTES32)
      ).to.be.revertedWith("Only buyer can release funds");
    });
  });

  describe("5. Reembolsos y Expiración (claimRefund)", function () {
    let orderId: string;
    let deadline: number;

    beforeEach(async function () {
      deadline = (await time.latest()) + 3600 * 24; // 24 horas
      await escrow.connect(buyer).createOrder(
        seller.address,
        await usdc.getAddress(),
        ORDER_AMOUNT,
        SECRET_HASH,
        deadline,
        "Mercadería Vencible"
      );
      const orders = await escrow.getUserOrders(buyer.address);
      orderId = orders[0];
    });

    it("Rechaza reclamo de reembolso antes de que expire el deadline", async function () {
      await expect(
        escrow.connect(buyer).claimRefund(orderId)
      ).to.be.revertedWith("Deadline has not passed yet");
    });

    it("Comprador reclama unilateralmente el 100% una vez transcurrido el deadline", async function () {
      // Avanzar el tiempo más allá del deadline
      await time.increaseTo(deadline + 10);

      const buyerBalBefore = await usdc.balanceOf(buyer.address);
      await escrow.connect(buyer).claimRefund(orderId);

      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalBefore + ORDER_AMOUNT);
      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(4n); // REFUNDED
    });
  });

  describe("6. Cancelación de Orden (cancelOrder)", function () {
    let orderId: string;

    beforeEach(async function () {
      const deadline = (await time.latest()) + 3600 * 48;
      await escrow.connect(buyer).createOrder(
        seller.address,
        await usdc.getAddress(),
        ORDER_AMOUNT,
        SECRET_HASH,
        deadline,
        "Orden para cancelar"
      );
      const orders = await escrow.getUserOrders(buyer.address);
      orderId = orders[0];
    });

    it("Comprador puede cancelar antes del despacho y recuperar sus fondos", async function () {
      const buyerBalBefore = await usdc.balanceOf(buyer.address);
      await escrow.connect(buyer).cancelOrder(orderId);

      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalBefore + ORDER_AMOUNT);
      const order = await escrow.getOrder(orderId);
      expect(order.status).to.equal(5n); // CANCELLED
    });

    it("No se puede cancelar una orden una vez despachada", async function () {
      await escrow.connect(seller).confirmDispatch(orderId, "Guia Despachada #123");

      await expect(
        escrow.connect(buyer).cancelOrder(orderId)
      ).to.be.revertedWith("Cannot cancel after dispatch");
    });
  });
});
