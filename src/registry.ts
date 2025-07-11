/**
 * Registry Module
 *
 * This module defines the configuration for supported blockchain networks, including
 * contract addresses for vaults, oracles, and other relevant infrastructure.
 *
 * The registry serves as a central configuration point for the application, allowing
 * it to connect to different blockchains and interact with the appropriate smart contracts.
 *
 * @module registry
 */
import type { MangroveActionsDefaultParams } from "@mangrovedao/mgv";
import { arbitrumMangrove, baseMangrove, seiMangrove } from "@mangrovedao/mgv/addresses";
import type { Address, Chain } from "viem";
import { arbitrum, base, sei } from "viem/chains";

/**
 * Represents an oracle factory configuration
 *
 * @property oracleFactory - The address of the oracle factory contract
 * @property type - The type of oracle factory (chainlinkv1, chainlinkv2, diav1, or combinerv1)
 */
export type OracleFactory = {
  oracleFactory: Address;
  type: "chainlinkv1" | "chainlinkv2" | "diav1" | "combinerv1";
};

/**
 * Represents vault-related contract addresses and configurations
 *
 * @property VAULT_FACTORY - The address of the vault factory contract
 * @property MINT_HELPER - The address of the mint helper contract
 * @property SIMPLE_VAULTS_SEEDER - A map of seeder types to their contract addresses
 * @property ORACLE_FACTORIES - A map of oracle factory names to their configurations
 * @property ERC4626_VAULT_FACTORIES - A map of vault factory types to their contract addresses
 * @property ERC4626_VAULT_SEEDERS - A map of vault seeder types to their contract addresses
 */
type VaultRegistryEntry = {
  VAULT_FACTORY: Address;
  MINT_HELPER: Address;
  SIMPLE_VAULTS_SEEDER: Record<string, Address>;
  ORACLE_FACTORIES: Record<string, OracleFactory>;
  ERC4626_VAULT_FACTORIES: Record<string, Address>;
  ERC4626_VAULT_SEEDERS: Record<string, Address>;
};

/**
 * Represents a rebalance entry with a specific type and associated data
 *
 * @template TType - The type identifier for the rebalance service
 * @template TData - The data structure specific to the rebalance service type
 * @property type - The type of rebalance service (e.g., "odos")
 * @property data - Configuration data specific to the rebalance service
 */
type RebalanceEntry<TType extends string, TData> = {
  type: TType;
  data: TData;
};

export type OdosRebalanceEntry = RebalanceEntry<
  "odos",
  { apiLink: string; assembleUrl: string; contract: Address }
>;

export type KameRebalanceEntry = RebalanceEntry<
  "kame",
  { contract: Address }
>;

export type SymphonyRebalanceEntry = RebalanceEntry<
  "symphony",
  { contract: Address }
>;

/**
 * Collection of rebalance service configurations
 *
 * Maps service identifiers to their respective configurations.
 * Currently supports Odos, Kame, and Symphony as rebalancing services.
 */
type RebalanceEntries = Record<string, OdosRebalanceEntry | KameRebalanceEntry | SymphonyRebalanceEntry>;

/**
 * Represents a complete entry in the registry for a blockchain network
 *
 * @property chain - The blockchain network
 * @property vault - Vault-related contract addresses and configurations
 * @property mangrove - Mangrove protocol configuration
 * @property chainlinkMetadataLink - URL to fetch Chainlink price feed metadata
 */
export type RegistryEntry = {
  chain: Chain;
  vault: VaultRegistryEntry;
  mangrove: MangroveActionsDefaultParams;
  chainlinkMetadataLink: string;
  rebalance: RebalanceEntries;
  rpcURL: string | undefined;
};

/**
 * The main registry containing configurations for all supported blockchain networks
 *
 * Currently supports:
 * - Arbitrum
 * - Base
 */
export const registry: Array<RegistryEntry> = [
  {
    chain: base,
    vault: {
      VAULT_FACTORY: "0x26A0e433f89317Ca5585945198a5F0760C1dAFA5",
      ERC4626_VAULT_FACTORIES: {
        erc4626: "0x92dB74A11Ec2b2acDCFC354cf55243cF33C052B8",
      },
      MINT_HELPER: "0x2AE6F95F0AC61441D9eC9290000F81087567cDa1",
      SIMPLE_VAULTS_SEEDER: {
        simple: "0x808bC04030bC558C99E6844e877bb22D166A089A",
        aave: "0x095854c8C4591Fb0a413615B9a366B4Dd69b9B1D",
      },
      ERC4626_VAULT_SEEDERS: {
        erc4626: "0x4778c54E6380BBC6eF9647f2A31528B0640B41fE",
      },
      ORACLE_FACTORIES: {
        chainlinkv1: {
          oracleFactory: "0x9d05c7A303efEbD215B86B57Da2Fc671039E5712",
          type: "chainlinkv1",
        },
        chainlinkv2: {
          oracleFactory: "0x656A6ac038D1686D4f80427ddaF59b352f960123",
          type: "chainlinkv2",
        },
        diav1: {
          oracleFactory: "0x5297561cb9df1D2Ff83698C6fc51aBeF24D39560",
          type: "diav1",
        },
        combinerv1: {
          oracleFactory: "0xb898C4a986a1e4Fd31b9818772F9EC16dbf3EFED",
          type: "combinerv1",
        },
      },
    },
    mangrove: baseMangrove,
    chainlinkMetadataLink:
      "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json",
    rebalance: {
      odos: {
        type: "odos",
        data: {
          apiLink: "https://api.odos.xyz/sor/quote/v2",
          assembleUrl: "https://api.odos.xyz/sor/assemble/v2",
          contract: "0x19cEeAd7105607Cd444F5ad10dd51356436095a1",
        },
      },
    },
    rpcURL: process.env.BASE_RPC_URL,
  },
  {
    chain: sei,
    mangrove: seiMangrove,
    vault: {
      VAULT_FACTORY: "0xd6cc0B43261a73209ccC135207b8Ba98D2Ba369e",
      MINT_HELPER: "0x1ae53888Ce926ca468C9574DD2cb885B005E0716",
      SIMPLE_VAULTS_SEEDER: {
        simple: "0x075420Cb1F213857FCbAF2C9dBfC6cA6295124A3",
        yei: "0x38845D7DAD5bF849E1f77fE89597083FEc5B5D77",
      },
      ORACLE_FACTORIES: {
        chainlinkv2: {
          oracleFactory: "0x625BC9a1D98f756106b2aeC6b2f14CDDC66f40eb",
          type: "chainlinkv2",
        },
        diav1: {
          oracleFactory: "0x035d53d54AEf1815e882feA7EF4795De214518A1",
          type: "diav1",
        },
        combinerv1: {
          oracleFactory: "0xFD8E85387Afe7E3dF1ED7Ec7B81e3de0C6FBeb19",
          type: "combinerv1",
        },
      },
      ERC4626_VAULT_FACTORIES: {
        erc4626: "0xADbB100770e1F9aC61eAC9ccA2eC05A0A66956A0",
      },
      ERC4626_VAULT_SEEDERS: {
        erc4626: "0x9c5AD9d0Fc127Af40B7Cd6279B696607e258BB11",
      },
    },
    chainlinkMetadataLink:
      "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-sei-1.json",
    rebalance: {
      kame: {
        type: "kame",
        data: {
          contract: "0x14bb98581Ac1F1a43fD148db7d7D793308Dc4d80",
        },
      },
      symphony: {
        type: "symphony",
        data: {
          contract: "0x3273dC2d56e4B93AdA05D55871886bD69b4CEf3D",
        },
      },
    },
    rpcURL: process.env.SEI_RPC_URL,
  },
  {
    chain: arbitrum,
    vault: {
      VAULT_FACTORY: "0x6B82CE8a45Ce9BeF9B20c3D65747356a5cDab41A",
      MINT_HELPER: "0xC39b5Fb38a8AcBFFB51D876f0C0DA0325b5cD440",
      SIMPLE_VAULTS_SEEDER: {
        simple: "0x89139Bed90B1Bfb5501F27bE6D6f9901aE35745D",
        aave: "0x55B12De431C6e355b56b79472a3632faec58FB5a",
      },
      ORACLE_FACTORIES: {
        chainlinkv1: {
          oracleFactory: "0x31c47E3F442F521E1c65b5b626aC2e978C1f2587",
          type: "chainlinkv1",
        },
      },
      ERC4626_VAULT_FACTORIES: {},
      ERC4626_VAULT_SEEDERS: {},
    },
    mangrove: arbitrumMangrove,
    chainlinkMetadataLink:
      "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-arbitrum-1.json",
    rebalance: {
      odos: {
        type: "odos",
        data: {
          apiLink: "https://api.odos.xyz/sor/quote/v2",
          contract: "0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13",
          assembleUrl: "https://api.odos.xyz/sor/assemble/v2",
        },
      },
    },
    rpcURL: process.env.ARBITRUM_RPC_URL,
  },
];
