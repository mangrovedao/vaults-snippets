export const MangroveChainlinkOracleFactoryAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "oracle",
        type: "address",
      },
    ],
    name: "OracleCreated",
    type: "event",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "feed",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "baseDecimals",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "quoteDecimals",
            type: "uint256",
          },
        ],
        internalType: "struct ChainlinkFeed",
        name: "baseFeed1",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "feed",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "baseDecimals",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "quoteDecimals",
            type: "uint256",
          },
        ],
        internalType: "struct ChainlinkFeed",
        name: "baseFeed2",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "feed",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "baseDecimals",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "quoteDecimals",
            type: "uint256",
          },
        ],
        internalType: "struct ChainlinkFeed",
        name: "quoteFeed1",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "feed",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "baseDecimals",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "quoteDecimals",
            type: "uint256",
          },
        ],
        internalType: "struct ChainlinkFeed",
        name: "quoteFeed2",
        type: "tuple",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
    ],
    name: "create",
    outputs: [
      {
        internalType: "contract MangroveChainlinkOracle",
        name: "oracle",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
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
    name: "isOracle",
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
] as const;
