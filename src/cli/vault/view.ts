/**
 * Vault Viewing Module
 * 
 * This module provides functionality for viewing detailed information about vaults through an interactive CLI.
 * It displays market data, fee structures, position parameters, balances, and offer information.
 */
import { getCurrentVaultState, type CurrentVaultState } from "../../vault/read";
import type { Address, PublicClient } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectVault, type SavedVault } from "../select";
import { formatUnits } from "viem";
import { logger } from "../../utils/logger";
import chalk from "chalk";
import readline from "readline/promises";
import readlineSync from "readline";
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
 * @param vault - The address of the vault to view
 */
export async function viewVault(
  publicClient: PublicClient,
  registry: RegistryEntry,
  vault?: SavedVault,
  vaultState?: CurrentVaultState
) {
  // Select the vault to view
  if (!vault) {
    vault = await selectVault(publicClient, registry.chain.id);
  }
  if (!vault) {
    logger.error("No vault selected");
    return;
  }
  
  // Fetch current state data for the selected vault
  const data = vaultState ?? await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );

  // Save the current cursor position
  // process.stdout.write('\u001b[s');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const initPos = rl.getCursorPos();


  // start logging info
  
  // Display market information
  logger.info(
    `Market : ${data.market.base.symbol}/${data.market.quote.symbol} (tickSpacing: ${data.market.tickSpacing})`
  );
  
  // Display fee configuration
  logger.logFees(data.feeData);
  
  // Display position parameters
  logger.logPosition(data.position, data.market);
  
  // Display token balances for both Kandel strategy and vault
  logger.info("Balances :");
  logger.table({
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
  logger.info("Addresses :");
  logger.table({
    oracle: data.oracle,
    owner: data.owner,
    kandel: data.kandel,
    feeRecipient: data.feeData.feeRecipient,
  });
  
  // Display current market price and tick
  logger.info(
    `Current price : ${data.currentPrice} (tick: ${data.currentTick})`
  );
  
  // Display Kandel strategy state
  logger.info(chalk.bold("position from kandel contract :"));
  logger.table({
    ...data.kandelState,
    asks: data.kandelState.asks.length,
    bids: data.kandelState.bids.length,
  });
  
  // Display active offers if any exist
  if (data.kandelState.asks.length > 0 || data.kandelState.bids.length > 0) {
    logger.table([...data.kandelState.asks, ...data.kandelState.bids]);
  }


  await rl.question("\nPress any key to continue...");

  // Restore cursor to saved position and clear everything below it
  // process.stdout.write('\u001b[u\u001b[J');

  await new Promise((resolve) => readlineSync.cursorTo(process.stdout, initPos.rows, initPos.cols, () => resolve(true)));
  await new Promise((resolve) => readlineSync.clearScreenDown(process.stdout, () => resolve(true)));
  rl.close(); // stop listening
}
