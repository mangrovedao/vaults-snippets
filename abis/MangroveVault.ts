export const MangroveVaultAbi = [
  {
    inputs: [
      {
        internalType: "contract AbstractKandelSeeder",
        name: "_seeder",
        type: "address",
      },
      {
        internalType: "address",
        name: "_BASE",
        type: "address",
      },
      {
        internalType: "address",
        name: "_QUOTE",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_tickSpacing",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "_decimals",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "address",
        name: "_oracle",
        type: "address",
      },
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "AddressInsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "unauthorizedToken",
        type: "address",
      },
    ],
    name: "CannotWithdrawToken",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "currentTotal",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nextTotal",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxTotal",
        type: "uint256",
      },
    ],
    name: "DepositExceedsMaxTotal",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "allowance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC20InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "ERC20InvalidSpender",
    type: "error",
  },
  {
    inputs: [],
    name: "EnforcedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "ExpectedPause",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedInnerCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "actual",
        type: "uint256",
      },
    ],
    name: "InitialMintSharesMismatch",
    type: "error",
  },
  {
    inputs: [],
    name: "MathOverflowedMulDiv",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "maxAllowed",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "attempted",
        type: "uint256",
      },
    ],
    name: "MaxFeeExceeded",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "QuoteAmountOverflow",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "bits",
        type: "uint8",
      },
      {
        internalType: "int256",
        name: "value",
        type: "int256",
      },
    ],
    name: "SafeCastOverflowedIntDowncast",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "bits",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "SafeCastOverflowedUintDowncast",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "SafeCastOverflowedUintToInt",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "expected",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "received",
        type: "uint256",
      },
    ],
    name: "SlippageExceeded",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "UnauthorizedSwapContract",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAmount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "feeShares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newTotalInQuote",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "AccrueInterest",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "tick",
        type: "int256",
      },
    ],
    name: "Burn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "tick",
        type: "int256",
      },
    ],
    name: "Mint",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "performanceFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "managementFee",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
    ],
    name: "SetFeeData",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "int256",
        name: "tickIndex0",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tickOffset",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "gasprice",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint24",
        name: "gasreq",
        type: "uint24",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "stepSize",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "pricePoints",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "enum FundsState",
        name: "fundsState",
        type: "uint8",
      },
    ],
    name: "SetKandelPosition",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "maxTotalInQuote",
        type: "uint256",
      },
    ],
    name: "SetMaxTotalInQuote",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "pool",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "baseAmountChange",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "quoteAmountChange",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "sell",
        type: "bool",
      },
    ],
    name: "Swap",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "swapContract",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "allowed",
        type: "bool",
      },
    ],
    name: "SwapContractAllowed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "lastTotalInQuote",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "UpdateLastTotalInQuote",
    type: "event",
  },
  {
    inputs: [],
    name: "MGV",
    outputs: [
      {
        internalType: "contract IMangrove",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "allowSwapContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "allowedSwapContracts",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minAmountBaseOut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minAmountQuoteOut",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [
      {
        internalType: "uint256",
        name: "amountBaseOut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountQuoteOut",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "currentTick",
    outputs: [
      {
        internalType: "Tick",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "disallowSwapContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "feeData",
    outputs: [
      {
        internalType: "uint16",
        name: "performanceFee",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "managementFee",
        type: "uint16",
      },
      {
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "fundMangrove",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "fundsState",
    outputs: [
      {
        internalType: "enum FundsState",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getKandelBalances",
    outputs: [
      {
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "baseAmountMax",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmountMax",
        type: "uint256",
      },
    ],
    name: "getMintAmounts",
    outputs: [
      {
        internalType: "uint256",
        name: "baseAmountOut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmountOut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalInQuote",
    outputs: [
      {
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
      {
        internalType: "Tick",
        name: "tick",
        type: "int256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getUnderlyingBalances",
    outputs: [
      {
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "share",
        type: "uint256",
      },
    ],
    name: "getUnderlyingBalancesByShare",
    outputs: [
      {
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getVaultBalances",
    outputs: [
      {
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "kandel",
    outputs: [
      {
        internalType: "contract GeometricKandel",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "kandelParams",
    outputs: [
      {
        components: [
          {
            internalType: "uint32",
            name: "gasprice",
            type: "uint32",
          },
          {
            internalType: "uint24",
            name: "gasreq",
            type: "uint24",
          },
          {
            internalType: "uint32",
            name: "stepSize",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "pricePoints",
            type: "uint32",
          },
        ],
        internalType: "struct Params",
        name: "params",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "kandelTickOffset",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastTimestamp",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "market",
    outputs: [
      {
        internalType: "address",
        name: "base",
        type: "address",
      },
      {
        internalType: "address",
        name: "quote",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tickSpacing",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "mintAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "baseAmountMax",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmountMax",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [
      {
        internalType: "uint256",
        name: "shares",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "quoteAmount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "oracle",
    outputs: [
      {
        internalType: "contract IOracle",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "pause_",
        type: "bool",
      },
    ],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "seeder",
    outputs: [
      {
        internalType: "contract AbstractKandelSeeder",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "performanceFee",
        type: "uint16",
      },
      {
        internalType: "uint16",
        name: "managementFee",
        type: "uint16",
      },
      {
        internalType: "address",
        name: "feeRecipient",
        type: "address",
      },
    ],
    name: "setFeeData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint128",
        name: "maxTotalInQuote",
        type: "uint128",
      },
    ],
    name: "setMaxTotalInQuote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "Tick",
            name: "tickIndex0",
            type: "int256",
          },
          {
            internalType: "uint256",
            name: "tickOffset",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "uint32",
                name: "gasprice",
                type: "uint32",
              },
              {
                internalType: "uint24",
                name: "gasreq",
                type: "uint24",
              },
              {
                internalType: "uint32",
                name: "stepSize",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "pricePoints",
                type: "uint32",
              },
            ],
            internalType: "struct Params",
            name: "params",
            type: "tuple",
          },
          {
            internalType: "enum FundsState",
            name: "fundsState",
            type: "uint8",
          },
        ],
        internalType: "struct KandelPosition",
        name: "position",
        type: "tuple",
      },
    ],
    name: "setPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountInMin",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "sell",
        type: "bool",
      },
    ],
    name: "swap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "amountOut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountInMin",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "sell",
        type: "bool",
      },
      {
        components: [
          {
            internalType: "Tick",
            name: "tickIndex0",
            type: "int256",
          },
          {
            internalType: "uint256",
            name: "tickOffset",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "uint32",
                name: "gasprice",
                type: "uint32",
              },
              {
                internalType: "uint24",
                name: "gasreq",
                type: "uint24",
              },
              {
                internalType: "uint32",
                name: "stepSize",
                type: "uint32",
              },
              {
                internalType: "uint32",
                name: "pricePoints",
                type: "uint32",
              },
            ],
            internalType: "struct Params",
            name: "params",
            type: "tuple",
          },
          {
            internalType: "enum FundsState",
            name: "fundsState",
            type: "uint8",
          },
        ],
        internalType: "struct KandelPosition",
        name: "position",
        type: "tuple",
      },
    ],
    name: "swapAndSetPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tickIndex0",
    outputs: [
      {
        internalType: "int24",
        name: "",
        type: "int24",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "updatePosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address payable",
        name: "receiver",
        type: "address",
      },
    ],
    name: "withdrawFromMangrove",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawNative",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const;