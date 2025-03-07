/**
 * Rebalance Module
 *
 * This module provides functionality for executing rebalance operations on Mangrove Vaults.
 * It handles the swap transaction process through the vault's swap function.
 */
import type { Client, Address, Hex } from "viem";
import { logger } from "../utils/logger";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { simulateContract } from "viem/actions";

/**
 * Arguments for performing a rebalance operation
 *
 * @property target - The address of the target contract to interact with
 * @property data - The calldata to pass to the target contract
 * @property amountOut - The amount of tokens to swap out
 * @property amountInMin - The minimum amount of tokens to receive (optional, defaults to 0)
 * @property sell - Whether this is a sell operation (true) or buy operation (false)
 */
export type RebalanceArgs = {
  target: Address;
  data: Hex;
  amountOut: bigint;
  amountInMin?: bigint | undefined;
  sell: boolean;
  gas?: bigint | undefined;
};

/**
 * Executes a rebalance operation on a Mangrove Vault
 *
 * This function:
 * 1. Simulates the swap transaction to ensure it will succeed
 * 2. Executes the swap transaction
 * 3. Waits for the transaction to be mined
 * 4. Logs the transaction status
 *
 * @param client - The blockchain client
 * @param sender - The address of the transaction sender
 * @param vault - The address of the Mangrove Vault
 * @param args - Configuration arguments for the rebalance operation
 * @returns Promise that resolves when the transaction is complete
 */
export async function rebalance(
  client: Client,
  sender: Address,
  vault: Address,
  args: RebalanceArgs
) {
  try {
    // Simulate the transaction first to check for potential errors
    const { request } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "swap",
      args: [
        args.target,
        args.data,
        args.amountOut,
        args.amountInMin ?? 0n, // Default to 0 if not provided
        args.sell,
      ],
      account: client.account,
      gas: args.gas,
    });

    const receipt = await logger.handleRequest(request, client, {
      success: (block, hash) => `swap success in block ${block}: ${hash}`,
      failure(hash) {
        return `swap failed: ${hash}`;
      },
      label: `Rebalance`,
      header: `Rebalancing ${vault}`,
    });
    return receipt.status === "success";
  } catch (error) {
    logger.error(error);
    return false;
  }
}
