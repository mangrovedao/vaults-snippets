export const MangroveVaultFactoryAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "seeder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "BASE",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "QUOTE",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tickSpacing",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "oracle",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "kandel",
        type: "address",
      },
    ],
    name: "VaultCreated",
    type: "event",
  },
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
    name: "createVault",
    outputs: [
      {
        internalType: "contract MangroveVault",
        name: "vault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
