export const MangroveChainlinkOracleAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_baseFeed1",
        type: "address",
      },
      {
        internalType: "address",
        name: "_baseFeed2",
        type: "address",
      },
      {
        internalType: "address",
        name: "_quoteFeed1",
        type: "address",
      },
      {
        internalType: "address",
        name: "_quoteFeed2",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_baseFeed1BaseDecimals",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_baseFeed1QuoteDecimals",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_baseFeed2BaseDecimals",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_baseFeed2QuoteDecimals",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quoteFeed1BaseDecimals",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quoteFeed1QuoteDecimals",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quoteFeed2BaseDecimals",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_quoteFeed2QuoteDecimals",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "OracleInvalidPrice",
    type: "error",
  },
  {
    inputs: [],
    name: "baseFeed1",
    outputs: [
      {
        internalType: "contract AggregatorV3Interface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseFeed1BaseDecimals",
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
    name: "baseFeed1Decimals",
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
    name: "baseFeed1QuoteDecimals",
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
    name: "baseFeed2",
    outputs: [
      {
        internalType: "contract AggregatorV3Interface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "baseFeed2BaseDecimals",
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
    name: "baseFeed2Decimals",
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
    name: "baseFeed2QuoteDecimals",
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
    name: "quoteFeed1",
    outputs: [
      {
        internalType: "contract AggregatorV3Interface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "quoteFeed1BaseDecimals",
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
    name: "quoteFeed1Decimals",
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
    name: "quoteFeed1QuoteDecimals",
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
    name: "quoteFeed2",
    outputs: [
      {
        internalType: "contract AggregatorV3Interface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "quoteFeed2BaseDecimals",
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
    name: "quoteFeed2Decimals",
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
    name: "quoteFeed2QuoteDecimals",
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
    name: "tick",
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
] as const;
