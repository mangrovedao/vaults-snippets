export const combinerFactoryABI = [
  {
    type: "function",
    name: "computeOracleAddress",
    inputs: [
      { name: "_oracle1", type: "address", internalType: "address" },
      { name: "_oracle2", type: "address", internalType: "address" },
      { name: "_oracle3", type: "address", internalType: "address" },
      { name: "_oracle4", type: "address", internalType: "address" },
      { name: "_salt", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "create",
    inputs: [
      { name: "_oracle1", type: "address", internalType: "address" },
      { name: "_oracle2", type: "address", internalType: "address" },
      { name: "_oracle3", type: "address", internalType: "address" },
      { name: "_oracle4", type: "address", internalType: "address" },
      { name: "_salt", type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [
      {
        name: "oracle",
        type: "address",
        internalType: "contract OracleCombiner",
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
