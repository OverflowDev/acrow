export const ESCROW_ABI = [
  // ─── Events ──────────────────────────────────────────────────────────────
  {
    type: 'event', name: 'ListingCreated',
    inputs: [
      { name: 'id',         type: 'uint256', indexed: true  },
      { name: 'seller',     type: 'address', indexed: true  },
      { name: 'price',      type: 'uint256', indexed: false },
      { name: 'collateral', type: 'uint256', indexed: false },
      { name: 'itemId',     type: 'string',  indexed: false },
    ],
  },
  {
    type: 'event', name: 'FundsDeposited',
    inputs: [
      { name: 'id',     type: 'uint256', indexed: true  },
      { name: 'buyer',  type: 'address', indexed: true  },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'DeliveryConfirmed',
    inputs: [
      { name: 'id',     type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event', name: 'ReceiptConfirmed',
    inputs: [
      { name: 'id',    type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event', name: 'FundsReleased',
    inputs: [
      { name: 'id',     type: 'uint256', indexed: true  },
      { name: 'seller', type: 'address', indexed: true  },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'CollateralReturned',
    inputs: [
      { name: 'id',        type: 'uint256', indexed: true  },
      { name: 'recipient', type: 'address', indexed: true  },
      { name: 'amount',    type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'DisputeInitiated',
    inputs: [
      { name: 'id',        type: 'uint256', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event', name: 'DisputeResolved',
    inputs: [
      { name: 'id',         type: 'uint256', indexed: true  },
      { name: 'winner',     type: 'address', indexed: true  },
      { name: 'favorBuyer', type: 'bool',    indexed: false },
    ],
  },
  {
    type: 'event', name: 'ListingCancelled',
    inputs: [{ name: 'id', type: 'uint256', indexed: true }],
  },

  // ─── Constructor ─────────────────────────────────────────────────────────
  {
    type: 'constructor',
    inputs: [
      { name: '_arbitrator', type: 'address' },
      { name: '_feeBps',     type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },

  // ─── Write Functions ──────────────────────────────────────────────────────
  {
    type: 'function', name: 'createListing',
    inputs: [
      { name: 'price',      type: 'uint256' },
      { name: 'collateral', type: 'uint256' },
      { name: 'itemId',     type: 'string'  },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function', name: 'depositFunds',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function', name: 'confirmDelivery',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'confirmReceipt',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'initiateDispute',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'cancelListing',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'resolveDispute',
    inputs: [
      { name: 'listingId',  type: 'uint256' },
      { name: 'favorBuyer', type: 'bool'    },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'setArbitrator',
    inputs: [{ name: '_arbitrator', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'setFeeBps',
    inputs: [{ name: '_feeBps', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ─── Read Functions ───────────────────────────────────────────────────────
  {
    type: 'function', name: 'getListing',
    inputs: [{ name: 'listingId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'id',              type: 'uint256' },
        { name: 'seller',          type: 'address' },
        { name: 'buyer',           type: 'address' },
        { name: 'price',           type: 'uint256' },
        { name: 'collateral',      type: 'uint256' },
        { name: 'createdAt',       type: 'uint256' },
        { name: 'lockedAt',        type: 'uint256' },
        { name: 'status',          type: 'uint8'   },
        { name: 'itemId',          type: 'string'  },
        { name: 'sellerConfirmed', type: 'bool'    },
        { name: 'buyerConfirmed',  type: 'bool'    },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getListings',
    inputs: [
      { name: 'from', type: 'uint256' },
      { name: 'to',   type: 'uint256' },
    ],
    outputs: [{
      type: 'tuple[]',
      components: [
        { name: 'id',              type: 'uint256' },
        { name: 'seller',          type: 'address' },
        { name: 'buyer',           type: 'address' },
        { name: 'price',           type: 'uint256' },
        { name: 'collateral',      type: 'uint256' },
        { name: 'createdAt',       type: 'uint256' },
        { name: 'lockedAt',        type: 'uint256' },
        { name: 'status',          type: 'uint8'   },
        { name: 'itemId',          type: 'string'  },
        { name: 'sellerConfirmed', type: 'bool'    },
        { name: 'buyerConfirmed',  type: 'bool'    },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'listingCount',
    inputs: [], outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'feeBps',
    inputs: [], outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'owner',
    inputs: [], outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'arbitrator',
    inputs: [], outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
] as const

export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'
) as `0x${string}`

export const IS_CONTRACT_DEPLOYED =
  !!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS &&
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'
