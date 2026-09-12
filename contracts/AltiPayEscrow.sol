// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAltiPayEscrow.sol";
import "./interfaces/IUnlockLock.sol";

/**
 * @title AltiPayEscrow
 * @notice Protocolo no custodial de custodia comercial condicional para encomiendas terrestres.
 * @author Luis Sandoval (DEV 1) — AltiPay Team
 */
contract AltiPayEscrow is IAltiPayEscrow, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ── Constantes y Configuración de Comisiones ──
    uint256 public constant BASE_FEE_BPS = 50; // 0.50% (50 basis points)
    uint256 public constant BPS_DIVISOR = 10000;

    address public feeRecipient;
    IUnlockLock public vipLock; // Contrato Unlock Protocol para 0% fee waiver

    // ── Storage ──
    mapping(bytes32 => Order) public orders;
    mapping(address => bytes32[]) public userOrderIds;
    uint256 public orderCount;

    // ── Constructor ──
    constructor(address _feeRecipient, address _vipLock) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        vipLock = IUnlockLock(_vipLock);
    }

    // ── Funciones Principales de Negocio ──

    /**
     * @notice Crea y fondea una orden bloqueando el monto en tokens ERC-20 (USDC).
     * @param _seller Dirección de wallet del vendedor.
     * @param _token Dirección del token ERC-20 (ej. USDC).
     * @param _amount Monto exacto a custodiar.
     * @param _secretHash keccak256(secreto) generado por el comprador.
     * @param _deadline Timestamp Unix de expiración de la custodia.
     * @param _description Descripción de la mercadería o bultos.
     * @return orderId Identificador criptográfico único de la orden creada.
     */
    function createOrder(
        address _seller,
        address _token,
        uint256 _amount,
        bytes32 _secretHash,
        uint256 _deadline,
        string calldata _description
    ) external nonReentrant returns (bytes32 orderId) {
        // Checks
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Buyer cannot be seller");
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be > 0");
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(_secretHash != bytes32(0), "Secret hash cannot be zero");

        orderCount++;
        orderId = keccak256(
            abi.encodePacked(
                msg.sender,
                _seller,
                _amount,
                _secretHash,
                orderCount,
                block.chainid
            )
        );
        require(orders[orderId].status == OrderStatus.NONE, "Order ID collision");

        // Effects
        orders[orderId] = Order({
            buyer: msg.sender,
            seller: _seller,
            token: _token,
            amount: _amount,
            secretHash: _secretHash,
            deadline: _deadline,
            status: OrderStatus.FUNDED,
            description: _description,
            trackingInfo: "",
            createdAt: block.timestamp,
            completedAt: 0
        });

        userOrderIds[msg.sender].push(orderId);
        userOrderIds[_seller].push(orderId);

        // Interactions (CEI)
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        emit OrderCreated(
            orderId,
            msg.sender,
            _seller,
            _token,
            _amount,
            _secretHash,
            _deadline,
            _description
        );
    }

    /**
     * @notice El vendedor confirma el despacho de mercadería y registra la guía de transporte.
     * @param _orderId Identificador de la orden.
     * @param _trackingInfo Datos de tracking (ej. "Flota Bolivar #84920").
     */
    function confirmDispatch(
        bytes32 _orderId,
        string calldata _trackingInfo
    ) external {
        Order storage order = orders[_orderId];

        // Checks
        require(order.status == OrderStatus.FUNDED, "Order not in FUNDED state");
        require(order.seller == msg.sender, "Only seller can dispatch");
        require(bytes(_trackingInfo).length > 0, "Tracking info required");

        // Effects
        order.status = OrderStatus.DISPATCHED;
        order.trackingInfo = _trackingInfo;

        emit OrderDispatched(_orderId, msg.sender, _trackingInfo);
    }

    /**
     * @notice El comprador libera los fondos atómicamente al verificar la entrega con el código secreto.
     * @param _orderId Identificador de la orden.
     * @param _secret Código secreto en texto plano o bytes32.
     */
    function confirmDeliveryWithSecret(
        bytes32 _orderId,
        bytes32 _secret
    ) external nonReentrant {
        Order storage order = orders[_orderId];

        // Checks
        require(
            order.status == OrderStatus.FUNDED || order.status == OrderStatus.DISPATCHED,
            "Order not eligible for delivery"
        );
        require(order.buyer == msg.sender, "Only buyer can release funds");
        require(
            keccak256(abi.encodePacked(_secret)) == order.secretHash,
            "Invalid secret code"
        );

        // Effects
        order.status = OrderStatus.COMPLETED;
        order.completedAt = block.timestamp;

        // Comprobación de membresía VIP con Unlock Protocol
        uint256 fee = 0;
        bool isVIP = false;
        if (address(vipLock) != address(0)) {
            try vipLock.getHasValidKey(order.buyer) returns (bool valid) {
                isVIP = valid;
            } catch {
                isVIP = false;
            }
        }

        if (!isVIP) {
            fee = (order.amount * BASE_FEE_BPS) / BPS_DIVISOR;
        }

        uint256 netAmount = order.amount - fee;

        // Interactions (CEI)
        if (fee > 0 && feeRecipient != address(0)) {
            IERC20(order.token).safeTransfer(feeRecipient, fee);
        }
        IERC20(order.token).safeTransfer(order.seller, netAmount);

        emit OrderCompleted(_orderId, order.seller, netAmount, fee, block.timestamp);
    }

    /**
     * @notice Reclamo unilateral de reembolso para el comprador si expira el plazo sin entrega.
     * @param _orderId Identificador de la orden.
     */
    function claimRefund(bytes32 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];

        // Checks
        require(
            order.status == OrderStatus.FUNDED || order.status == OrderStatus.DISPATCHED,
            "Order not refundable"
        );
        require(order.buyer == msg.sender, "Only buyer can claim refund");
        require(block.timestamp > order.deadline, "Deadline has not passed yet");

        // Effects
        order.status = OrderStatus.REFUNDED;
        order.completedAt = block.timestamp;

        // Interactions (CEI)
        IERC20(order.token).safeTransfer(order.buyer, order.amount);

        emit OrderRefunded(_orderId, msg.sender, order.amount, block.timestamp);
    }

    /**
     * @notice Cancela la orden antes de que el vendedor haya registrado el despacho.
     * @param _orderId Identificador de la orden.
     */
    function cancelOrder(bytes32 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];

        // Checks
        require(order.status == OrderStatus.FUNDED, "Cannot cancel after dispatch");
        require(order.buyer == msg.sender, "Only buyer can cancel");

        // Effects
        order.status = OrderStatus.CANCELLED;
        order.completedAt = block.timestamp;

        // Interactions (CEI)
        IERC20(order.token).safeTransfer(order.buyer, order.amount);

        emit OrderCancelled(_orderId, msg.sender, order.amount);
    }

    // ── Funciones de Consulta (View) ──

    function getOrder(bytes32 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }

    function getUserOrders(address _user) external view returns (bytes32[] memory) {
        return userOrderIds[_user];
    }

    function getUserOrderCount(address _user) external view returns (uint256) {
        return userOrderIds[_user].length;
    }

    // ── Administración ──

    function setVIPLock(address _newLock) external onlyOwner {
        vipLock = IUnlockLock(_newLock);
        emit VIPLockUpdated(_newLock);
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Zero address");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }
}
