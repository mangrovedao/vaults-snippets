/**
 * Vault Viewing Module
 * 
 * This module provides functionality for viewing detailed information about vaults through an interactive CLI.
 * It displays market data, fee structures, position parameters, balances, and offer information.
 */
import { getCurrentVaultState } from "../../vault/read";
import { FundsState } from "../../vault/position";
import type { PublicClient } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectAddress, selectVault } from "../select";
import { formatUnits } from "viem";
import { logger } from "../../utils/logger";
import chalk from "chalk";

/**
 * Displays comprehensive information about a selected vault
 * 
 * This function:
 * 1. Prompts the user to select a vault
 * 2. Fetches the current state of the selected vault
 * 3. Displays detailed information including:
 *    - Market details (base/quote tokens, tick spacing)
 *    - Fee configuration
 *    - Position parameters
 *    - Token balances (both in Kandel strategy and vault)
 *    - Contract addresses
 *    - Current market price
 *    - Kandel strategy state and active offers
 * 
 * @param publicClient - The public blockchain client for reading data
 * @param registry - The registry entry containing contract addresses and chain information
 */
export async function viewVault(
  publicClient: PublicClient,
  registry: RegistryEntry
) {
  // Select the vault to view
  const vault = await selectVault(publicClient, registry.chain.id);
  
  // Fetch current state data for the selected vault
  const data = await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );
  
  // Display market information
  console.log(
    `Market : ${data.market.base.symbol}/${data.market.quote.symbol} (tickSpacing: ${data.market.tickSpacing})`
  );
  
  // Display fee configuration
  logger.logFees(data.feeData);
  
  // Display position parameters
  logger.logPosition(data.position, data.market);
  
  // Display token balances for both Kandel strategy and vault
  console.log("Balances :");
  console.table({
    kandel: {
      base: `${formatUnits(
        data.kandelBalance.base,
        data.market.base.decimals
      )} ${data.market.base.symbol}`,
      quote: `${formatUnits(
        data.kandelBalance.quote,
        data.market.quote.decimals
      )} ${data.market.quote.symbol}`,
    },
    vault: {
      base: `${formatUnits(
        data.vaultBalance.base,
        data.market.base.decimals
      )} ${data.market.base.symbol}`,
      quote: `${formatUnits(
        data.vaultBalance.quote,
        data.market.quote.decimals
      )} ${data.market.quote.symbol}`,
    },
  });
  
  // Display contract addresses
  console.log("Addresses :");
  console.table({
    oracle: data.oracle,
    owner: data.owner,
    kandel: data.kandel,
    feeRecipient: data.feeData.feeRecipient,
  });
  
  // Display current market price and tick
  console.log(
    `Current price : ${data.currentPrice} (tick: ${data.currentTick})`
  );
  
  // Display Kandel strategy state
  console.log(chalk.bold("position from kandel contract :"));
  console.table({
    ...data.kandelState,
    asks: data.kandelState.asks.length,
    bids: data.kandelState.bids.length,
  });
  
  // Display active offers if any exist
  if (data.kandelState.asks.length > 0 || data.kandelState.bids.length > 0) {
    console.table([...data.kandelState.asks, ...data.kandelState.bids]);
  }
}
