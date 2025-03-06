export const diaFactoryABI = [
  {
    type: "function",
    name: "computeOracleAddress",
    inputs: [
      {
        name: "baseFeed1",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "baseFeed2",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "quoteFeed1",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "quoteFeed2",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "baseVault",
        type: "tuple",
        internalType: "struct ERC4626Feed",
        components: [
          { name: "vault", type: "address", internalType: "address" },
          {
            name: "conversionSample",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "quoteVault",
        type: "tuple",
        internalType: "struct ERC4626Feed",
        components: [
          { name: "vault", type: "address", internalType: "address" },
          {
            name: "conversionSample",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      { name: "salt", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "create",
    inputs: [
      {
        name: "baseFeed1",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "baseFeed2",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "quoteFeed1",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "quoteFeed2",
        type: "tuple",
        internalType: "struct DiaFeed",
        components: [
          { name: "oracle", type: "address", internalType: "address" },
          { name: "key", type: "bytes32", internalType: "bytes32" },
          { name: "priceDecimals", type: "uint256", internalType: "uint256" },
          { name: "baseDecimals", type: "uint256", internalType: "uint256" },
          { name: "quoteDecimals", type: "uint256", internalType: "uint256" },
        ],
      },
      {
        name: "baseVault",
        type: "tuple",
        internalType: "struct ERC4626Feed",
        components: [
          { name: "vault", type: "address", internalType: "address" },
          {
            name: "conversionSample",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      {
        name: "quoteVault",
        type: "tuple",
        internalType: "struct ERC4626Feed",
        components: [
          { name: "vault", type: "address", internalType: "address" },
          {
            name: "conversionSample",
            type: "uint256",
            internalType: "uint256",
          },
        ],
      },
      { name: "salt", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [
      {
        name: "oracle",
        type: "address",
        internalType: "contract MangroveDiaOracle",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isOracle",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "OracleCreated",
    inputs: [
      {
        name: "creator",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "oracle",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
] as const;
