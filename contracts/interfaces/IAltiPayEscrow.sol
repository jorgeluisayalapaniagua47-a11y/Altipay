// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAltiPayEscrow
 * @notice Interfaz canónica del protocolo de custodia comercial AltiPay.
 */
interface IAltiPayEscrow {
    enum OrderStatus {
        NONE,        // 0: No existe
        FUNDED,      // 1: Fondos custodiados
        DISPATCHED,  // 2: Despachado por vendedor
        COMPLETED,   // 3: Entregado y fondos liberados
        REFUNDED,    // 4: Reembolsado por timeout
        CANCELLED    // 5: Cancelado antes de despacho
    }

    struct Order {
        address buyer;
        address seller;
        address token;
        uint256 amount;
        bytes32 secretHash;
        uint256 deadline;
        OrderStatus status;
        string description;
        string trackingInfo;
        uint256 createdAt;
        uint256 completedAt;
    }

    event OrderCreated(
        bytes32 indexed orderId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount,
        bytes32 secretHash,
        uint256 deadline,
        string description
    );

    event OrderDispatched(
        bytes32 indexed orderId,
        address indexed seller,
        string trackingInfo
    );

    event OrderCompleted(
        bytes32 indexed orderId,
        address indexed seller,
        uint256 netAmount,
        uint256 feePaid,
        uint256 completedAt
    );

    event OrderRefunded(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount,
        uint256 refundedAt
    );

    event OrderCancelled(
        bytes32 indexed orderId,
        address indexed buyer,
        uint256 amount
    );

    event VIPLockUpdated(address indexed newLock);
    event FeeRecipientUpdated(address indexed newRecipient);

    function createOrder(
        address _seller,
        address _token,
        uint256 _amount,
        bytes32 _secretHash,
        uint256 _deadline,
        string calldata _description
    ) external returns (bytes32 orderId);

    function confirmDispatch(
        bytes32 _orderId,
        string calldata _trackingInfo
    ) external;

    function confirmDeliveryWithSecret(
        bytes32 _orderId,
        bytes32 _secret
    ) external;

    function claimRefund(bytes32 _orderId) external;

    function cancelOrder(bytes32 _orderId) external;

    function getOrder(bytes32 _orderId) external view returns (Order memory);

    function getUserOrders(address _user) external view returns (bytes32[] memory);

    function getUserOrderCount(address _user) external view returns (uint256);
}
