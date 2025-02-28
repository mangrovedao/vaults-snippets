import type { MangroveActionsDefaultParams } from "@mangrovedao/mgv"
import { arbitrumMangrove } from "@mangrovedao/mgv/addresses"
import type { Address, Chain } from "viem"
import { arbitrum } from "viem/chains"

type VaultRegistryEntry = {
  VAULT_FACTORY: Address
  ORACLE_FACTORY: Address
  MINT_HELPER: Address,
  SIMPLE_VAULTS_SEEDER: Record<string, Address>
}

export type RegistryEntry = {
  chain: Chain
  vault: VaultRegistryEntry
  mangrove: MangroveActionsDefaultParams
  chainlinkMetadataLink: string
}

export const registry: Array<RegistryEntry> = [
  {
    chain: arbitrum,
    vault: {
      VAULT_FACTORY: "0x6B82CE8a45Ce9BeF9B20c3D65747356a5cDab41A",
      ORACLE_FACTORY: "0x31c47E3F442F521E1c65b5b626aC2e978C1f2587",
      MINT_HELPER: "0xC39b5Fb38a8AcBFFB51D876f0C0DA0325b5cD440",
      SIMPLE_VAULTS_SEEDER: {
        simple: "0x89139Bed90B1Bfb5501F27bE6D6f9901aE35745D",
        aave: "0x55B12De431C6e355b56b79472a3632faec58FB5a"
      },
    },
    mangrove: arbitrumMangrove,
    chainlinkMetadataLink: "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-arbitrum-1.json",
  },
];