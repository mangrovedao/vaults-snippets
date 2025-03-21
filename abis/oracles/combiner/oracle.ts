export const combinerOracleABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_oracle1", type: "address", internalType: "address" },
      { name: "_oracle2", type: "address", internalType: "address" },
      { name: "_oracle3", type: "address", internalType: "address" },
      { name: "_oracle4", type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "oracle1",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IOracle" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "oracle2",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IOracle" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "oracle3",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IOracle" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "oracle4",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IOracle" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tick",
    inputs: [],
    outputs: [{ name: "_tick", type: "int256", internalType: "Tick" }],
    stateMutability: "view",
  },
] as const;
