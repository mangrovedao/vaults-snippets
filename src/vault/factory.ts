/**
 * Vault Factory Module
 * 
 * This module provides functionality for deploying Mangrove Vaults through the
 * MangroveVaultFactory contract. Vaults are smart contracts that manage automated
 * liquidity provision on the Mangrove protocol.
 * 
 * @module vault/factory
 */
import type { Address, Client } from "viem";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { MangroveVaultFactoryAbi } from "../../abis/MangroveVaultFactory";
import { logger } from "../utils/logger";

/**
 * Arguments for deploying a vault
 * 
 * @property seeder - The address of the seeder contract that initializes the vault
 * @property base - The address of the base token (outbound token)
 * @property quote - The address of the quote token (inbound token)
 * @property tickSpacing - The tick spacing of the market
 * @property owner - Optional address of the vault owner (defaults to sender)
 * @property oracle - The address of the oracle contract for price feeds
 * @property name - The name of the vault token
 * @property symbol - The symbol of the vault token
 * @property decimals - Optional number of decimals for the vault token (defaults to 18)
 */
export type DeployVaultArgs = {
  seeder: Address;
  base: Address;
  quote: Address;
  tickSpacing: bigint;
  owner?: Address;
  oracle: Address;
  name: string;
  symbol: string;
  decimals?: number | undefined;
};

/**
 * Deploys a new Mangrove Vault
 * 
 * Calls the createVault function on the MangroveVaultFactory contract to create a new
 * vault with the specified parameters.
 * 
 * @param client - The blockchain client
 * @param vaultFactory - The address of the vault factory contract
 * @param sender - The address of the transaction sender
 * @param args - Arguments for deploying the vault
 * @returns The address of the deployed vault, or undefined if deployment fails
 */
export async function deployVault(
  client: Client,
  vaultFactory: Address,
  sender: Address,
  args: DeployVaultArgs
): Promise<Address | undefined> {
  try {
    const { result: vault, request: createVaultRequest } =
      await simulateContract(client, {
        address: vaultFactory,
        abi: MangroveVaultFactoryAbi,
        functionName: "createVault",
        args: [
          args.seeder,
          args.base,
          args.quote,
          args.tickSpacing,
          args.decimals ?? 18,
          args.name,
          args.symbol,
          args.oracle,
          args.owner ?? sender,
        ],
        account: client.account,
      });

    await logger.handleRequest(createVaultRequest, client, {
      header: `creating vault at address ${vault} with`,
      success: (block, hash) => `vault created at address ${vault} in block ${block}: ${hash}`,
      failure: (hash) => `vault creation failed at address ${vault}: ${hash}`,
      label: "Vault creation",
    });
    return vault;
  } catch (error) {
    logger.error(error);
    return undefined;
  }
}
