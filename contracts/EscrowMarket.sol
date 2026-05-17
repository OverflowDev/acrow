// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  Scrow EscrowMarket v2
 * @notice Trustless P2P escrow deployed on Arc Network.
 *
 *   Native token on Arc is USDC (18 decimals, EIP-1559).
 *   All `price`, `collateral`, and `msg.value` amounts are denominated
 *   in USDC — identical in precision to ETH on Ethereum.
 *
 *   Features:
 *   - Seller collateral  (skin-in-the-game; returned on success, paid to buyer if dispute won)
 *   - Dual confirmation  (seller marks "delivered", buyer marks "satisfied")
 *   - Atomic settlement  (sub-second finality on Arc — no reorgs)
 *   - Dispute arbitration via arbitrator address
 */
contract EscrowMarket is ReentrancyGuard {

    // ─── Types ────────────────────────────────────────────────────────────────

    enum Status { OPEN, LOCKED, COMPLETED, DISPUTED, CANCELLED }

    struct Listing {
        uint256 id;
        address seller;
        address buyer;
        uint256 price;            // buyer pays this (USDC on Arc, 18 decimals)
        uint256 collateral;       // seller deposits this as commitment (USDC on Arc)
        uint256 createdAt;
        uint256 lockedAt;
        Status  status;
        string  itemId;           // off-chain metadata UUID
        bool    sellerConfirmed;  // seller marked "I have delivered"
        bool    buyerConfirmed;   // buyer marked "I am satisfied"
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;

    address public owner;
    address public arbitrator;
    uint256 public feeBps;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ListingCreated(
        uint256 indexed id, address indexed seller,
        uint256 price, uint256 collateral, string itemId
    );
    event FundsDeposited(uint256 indexed id, address indexed buyer, uint256 amount);
    event DeliveryConfirmed(uint256 indexed id, address indexed seller);
    event ReceiptConfirmed(uint256 indexed id, address indexed buyer);
    event FundsReleased(uint256 indexed id, address indexed seller, uint256 amount);
    event CollateralReturned(uint256 indexed id, address indexed recipient, uint256 amount);
    event DisputeInitiated(uint256 indexed id, address indexed initiator);
    event DisputeResolved(uint256 indexed id, address indexed winner, bool favorBuyer);
    event ListingCancelled(uint256 indexed id);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error NotOwner();
    error NotArbitrator();
    error InvalidPrice();
    error WrongCollateral();
    error ListingNotOpen();
    error ListingNotLocked();
    error ListingNotDisputed();
    error WrongAmount();
    error SellerCannotBuy();
    error NotBuyer();
    error NotSeller();
    error NotParty();
    error FeeTooHigh();
    error TransferFailed();
    error AlreadyConfirmed();

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner()      { if (msg.sender != owner)      revert NotOwner();      _; }
    modifier onlyArbitrator() { if (msg.sender != arbitrator) revert NotArbitrator(); _; }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _arbitrator, uint256 _feeBps) {
        owner      = msg.sender;
        arbitrator = _arbitrator;
        feeBps     = _feeBps;
    }

    // ─── Seller: Create ───────────────────────────────────────────────────────

    /**
     * @notice Create a listing. For NFT/whitelist sales send collateral as msg.value.
     * @param price      Exact ETH the buyer must pay.
     * @param collateral ETH seller locks as commitment (msg.value must equal this).
     * @param itemId     UUID referencing off-chain metadata.
     */
    function createListing(
        uint256 price,
        uint256 collateral,
        string calldata itemId
    ) external payable returns (uint256) {
        if (price == 0)           revert InvalidPrice();
        if (msg.value != collateral) revert WrongCollateral();

        uint256 id = ++listingCount;
        listings[id] = Listing({
            id:               id,
            seller:           msg.sender,
            buyer:            address(0),
            price:            price,
            collateral:       collateral,
            createdAt:        block.timestamp,
            lockedAt:         0,
            status:           Status.OPEN,
            itemId:           itemId,
            sellerConfirmed:  false,
            buyerConfirmed:   false
        });

        emit ListingCreated(id, msg.sender, price, collateral, itemId);
        return id;
    }

    /**
     * @notice Seller cancels an open listing — collateral is refunded immediately.
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        if (l.status != Status.OPEN) revert ListingNotOpen();
        if (msg.sender != l.seller) revert NotSeller();

        l.status = Status.CANCELLED;
        if (l.collateral > 0) _transfer(l.seller, l.collateral);

        emit ListingCancelled(listingId);
    }

    // ─── Buyer: Deposit ───────────────────────────────────────────────────────

    /**
     * @notice Buyer locks exact ETH equal to listing price into this vault.
     */
    function depositFunds(uint256 listingId) external payable nonReentrant {
        Listing storage l = listings[listingId];
        if (l.status != Status.OPEN)  revert ListingNotOpen();
        if (msg.value != l.price)     revert WrongAmount();
        if (msg.sender == l.seller)   revert SellerCannotBuy();

        l.buyer    = msg.sender;
        l.lockedAt = block.timestamp;
        l.status   = Status.LOCKED;

        emit FundsDeposited(listingId, msg.sender, msg.value);
    }

    // ─── Dual Confirmation ────────────────────────────────────────────────────

    /**
     * @notice Seller marks "I have delivered the item / sent the whitelist spot."
     *         On-chain signal used for reputation. Does NOT release funds alone.
     */
    function confirmDelivery(uint256 listingId) external {
        Listing storage l = listings[listingId];
        if (l.status != Status.LOCKED)  revert ListingNotLocked();
        if (msg.sender != l.seller)     revert NotSeller();
        if (l.sellerConfirmed)          revert AlreadyConfirmed();

        l.sellerConfirmed = true;
        emit DeliveryConfirmed(listingId, msg.sender);
    }

    /**
     * @notice Buyer confirms satisfaction — releases price to seller.
     *         Collateral is returned to seller (they delivered) or to buyer
     *         (seller never confirmed delivery = compensation).
     *
     *         This is the "I AM SATISFIED" button from the P2P flow.
     */
    function confirmReceipt(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        if (l.status != Status.LOCKED) revert ListingNotLocked();
        if (msg.sender != l.buyer)     revert NotBuyer();
        if (l.buyerConfirmed)          revert AlreadyConfirmed();

        l.buyerConfirmed = true;
        l.status         = Status.COMPLETED;

        // Release price (minus platform fee) to seller
        uint256 fee          = (l.price * feeBps) / 10_000;
        uint256 sellerAmount = l.price - fee;
        _transfer(l.seller, sellerAmount);
        if (fee > 0) _transfer(owner, fee);
        emit FundsReleased(listingId, l.seller, sellerAmount);

        // Route collateral:
        //   ✓ Seller confirmed delivery  →  collateral back to seller
        //   ✗ Seller never confirmed     →  collateral to buyer as compensation
        if (l.collateral > 0) {
            address collateralTo = l.sellerConfirmed ? l.seller : l.buyer;
            _transfer(collateralTo, l.collateral);
            emit CollateralReturned(listingId, collateralTo, l.collateral);
        }
    }

    // ─── Dispute ──────────────────────────────────────────────────────────────

    function initiateDispute(uint256 listingId) external {
        Listing storage l = listings[listingId];
        if (l.status != Status.LOCKED)                        revert ListingNotLocked();
        if (msg.sender != l.buyer && msg.sender != l.seller)  revert NotParty();

        l.status = Status.DISPUTED;
        emit DisputeInitiated(listingId, msg.sender);
    }

    /**
     * @notice Arbitrator resolves a dispute.
     *   favorBuyer = true  → buyer gets price refund + collateral (seller defaulted)
     *   favorBuyer = false → seller gets price (minus fee) + collateral back
     */
    function resolveDispute(uint256 listingId, bool favorBuyer)
        external onlyArbitrator nonReentrant
    {
        Listing storage l = listings[listingId];
        if (l.status != Status.DISPUTED) revert ListingNotDisputed();

        l.status = Status.COMPLETED;

        if (favorBuyer) {
            // Full refund to buyer + collateral as compensation
            _transfer(l.buyer, l.price + l.collateral);
            emit DisputeResolved(listingId, l.buyer, true);
        } else {
            // Seller wins: gets price (minus fee) + collateral back
            uint256 fee = (l.price * feeBps) / 10_000;
            _transfer(l.seller, l.price - fee + l.collateral);
            if (fee > 0) _transfer(owner, fee);
            emit DisputeResolved(listingId, l.seller, false);
        }
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setArbitrator(address _arbitrator) external onlyOwner {
        arbitrator = _arbitrator;
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        if (_feeBps > 1000) revert FeeTooHigh();
        feeBps = _feeBps;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getListings(uint256 from, uint256 to) external view returns (Listing[] memory) {
        require(from >= 1 && from <= to && to <= listingCount, "Invalid range");
        Listing[] memory result = new Listing[](to - from + 1);
        for (uint256 i = from; i <= to; i++) {
            result[i - from] = listings[i];
        }
        return result;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _transfer(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = payable(to).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
