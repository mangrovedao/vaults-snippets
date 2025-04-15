/**
 * Vault Liquidity Removal Module
 * 
 * This module provides functionality for removing liquidity from vaults through an interactive CLI.
 * It allows users to burn vault LP tokens to withdraw their underlying assets.
 */
import {
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import type { RegistryEntry } from "../../registry";
import { getCurrentVaultState, type CurrentVaultState } from "../../vault/read";
import { getBalanceForToken } from "../balances";
import { selectAddress, selectVault, type SavedVault } from "../select";
import ora from "ora";
import inquirer from "inquirer";
import { burn } from "../../vault/burn";
import { logger } from "../../utils/logger";

/**
 * Guides the user through removing liquidity from a vault
 * 
 * This function:
 * 1. Prompts the user to select a vault
 * 2. Fetches the current vault state and user's LP token balance
 * 3. Allows the user to specify an amount or percentage of shares to burn
 * 4. Executes the burn transaction to withdraw underlying assets
 * 
 * @param publicClient - The public blockchain client for reading data
 * @param walletClient - The wallet client for signing transactions
 * @param account - The user's account address
 * @param registry - The registry entry containing contract addresses and chain information
 * @returns The result of the burn transaction
 */
export async function removeLiquidity(
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Address,
  registry: RegistryEntry,
  vault?: SavedVault,
  vaultState?: CurrentVaultState
) {
  // Select the vault to remove liquidity from
  if (!vault) {
    vault = await selectVault(publicClient, registry.chain.id);
  }
  if (!vault) {
    logger.error("No vault selected");
    return;
  }
  
  // Show loading spinner while fetching data
  const loader = ora("Getting vault state...").start();
  const vaultData = vaultState ?? await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );
  
  loader.text = "Fetching vault LP balance...";
  const balance = await getBalanceForToken(publicClient, account, vault.address);
  loader.succeed("Data fetched successfully");
  
  // Prompt user for the amount of shares to burn
  const { shares } = await inquirer.prompt({
    type: "input",
    name: "shares",
    message: `Enter the number of shares to remove (max: ${balance}) or a percentage (e.g. 50%):`,
    validate: (input) => {
      // Validate percentage input
      if (input.endsWith("%")) {
        const percentage = parseFloat(input.slice(0, -1));
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
          return "Please enter a valid percentage between 0 and 100";
        }
        if (percentage % 1 !== 0) {
          return "Please enter a whole number percentage";
        }
      } 
      // Validate direct share amount input
      else {
        const num = parseFloat(input);
        if (isNaN(num) || num <= 0) {
          return "Please enter a positive number";
        }
        if (num % 1 !== 0) {
          return "Please enter a whole number";
        }
      }
      return true;
    },
    filter: (input) => {
      if (input.endsWith("%")) {
        // Convert percentage to actual share amount
        const percentage = BigInt(input.slice(0, -1));
        return (balance * percentage) / 100n;
      }
      // Use direct share amount
      return BigInt(input);
    },
  }) as { shares: bigint };

  // Execute the burn transaction with minimum output amounts of 0
  // This means the user accepts any amount of underlying tokens
  return burn(walletClient, vault.address, shares, 0n, 0n, vaultData.market);
}
