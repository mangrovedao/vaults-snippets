/**
 * Whitelist Management Module
 *
 * This module provides functionality for managing the whitelist of swap contracts
 * that are allowed to interact with Mangrove Vaults. It handles adding and removing
 * contracts from the whitelist.
 */
import type { Client, Address } from "viem";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { logger } from "../utils/logger";

/**
 * Adds a swap contract to the vault's whitelist
 *
 * This function:
 * 1. Simulates the allowSwapContract transaction to ensure it will succeed
 * 2. Executes the transaction to add the contract to the whitelist
 * 3. Waits for the transaction to be mined
 * 4. Returns the success status of the operation
 *
 * @param client - The blockchain client
 * @param sender - The address of the transaction sender
 * @param vault - The address of the Mangrove Vault
 * @param swapContract - The address of the swap contract to whitelist
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function addToWhitelist(
  client: Client,
  sender: Address,
  vault: Address,
  swapContract: Address
): Promise<boolean> {
  try {
    // Simulate the transaction first to check for potential errors
    const { request } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "allowSwapContract",
      args: [swapContract],
      account: client.account,
    });
    const receipt = await logger.handleRequest(request, client, {
      success: (block, hash) =>
        `contract ${swapContract} whitelisted in block ${block}: ${hash}`,
      failure(hash) {
        return `contract ${swapContract} failed to be whitelisted: ${hash}`;
      },
      label: `Whitelisting`,
      header: `Whitelisting ${swapContract} for ${vault}`,
    });
    return receipt.status === "success";
  } catch (error) {
    logger.error(error);
    return false;
  }
}

/**
 * Removes a swap contract from the vault's whitelist
 *
 * This function:
 * 1. Simulates the disallowSwapContract transaction to ensure it will succeed
 * 2. Executes the transaction to remove the contract from the whitelist
 * 3. Waits for the transaction to be mined
 * 4. Returns the success status of the operation
 *
 * @param client - The blockchain client
 * @param sender - The address of the transaction sender
 * @param vault - The address of the Mangrove Vault
 * @param swapContract - The address of the swap contract to remove from whitelist
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function removeFromWhitelist(
  client: Client,
  sender: Address,
  vault: Address,
  swapContract: Address
): Promise<boolean> {
  try {
    logger.info(`Disallowing ${vault} from using ${swapContract}`);
    // Simulate the transaction first to check for potential errors
    const { request } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "disallowSwapContract",
      args: [swapContract],
      account: client.account,
    });

    const receipt = await logger.handleRequest(request, client, {
      success: (block, hash) =>
        `contract ${swapContract} whitelisted in block ${block}: ${hash}`,
      failure(hash) {
        return `contract ${swapContract} failed to be whitelisted: ${hash}`;
      },
      label: `Whitelisting`,
      header: `Whitelisting ${swapContract} for ${vault}`,
    });
    return receipt.status === "success";
  } catch (error) {
    logger.error(error);
    return false;
  }
}
