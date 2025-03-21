/**
 * Vault Liquidity Addition Module
 * 
 * This module provides functionality for adding liquidity to a vault through an interactive CLI.
 * It guides users through selecting a vault, entering token amounts, and confirming the transaction.
 */
import type { Address, PublicClient, WalletClient } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectAddress, selectVault } from "../select";
import { getCurrentVaultState, type CurrentVaultState } from "../../vault/read";
import ora from "ora";
import { getBalancesForMarket } from "../balances";
import inquirer from "inquirer";
import { formatUnits, parseUnits } from "viem";
import { getMintAmounts } from "../../vault/mint/get-mint-amount";
import { mint } from "../../vault/mint/mint";

/**
 * Guides the user through adding liquidity to a selected vault
 * 
 * This function:
 * 1. Prompts the user to select a vault
 * 2. Fetches current vault state and user token balances
 * 3. Guides the user through entering token amounts to add
 * 4. Calculates and displays the resulting shares and actual token amounts
 * 5. Confirms the transaction with the user before execution
 * 
 * @param publicClient - The public blockchain client for reading data
 * @param walletClient - The wallet client for signing transactions
 * @param account - The user's account address
 * @param registry - The registry entry containing contract addresses and chain information
 * @returns Transaction result or false if cancelled
 */
export async function addLiquidity(
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Address,
  registry: RegistryEntry,
  vault?: Address,
  vaultState?: CurrentVaultState
) {
  // Select vault to add liquidity to
  if (!vault) {
    vault = await selectVault(publicClient, registry.chain.id);
  }
  
  // Fetch vault state and user balances
  const loader = ora("Getting vault state...").start();
  const vaultData = vaultState ?? await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );
  loader.text = "Getting the user balance";
  const balances = await getBalancesForMarket(
    publicClient,
    account,
    vaultData.market
  );
  loader.succeed("Data Fetched successfully");

  // Extract token information for display
  const baseSymbol = vaultData.market.base.symbol;
  const quoteSymbol = vaultData.market.quote.symbol;
  const baseDecimals = vaultData.market.base.decimals;
  const quoteDecimals = vaultData.market.quote.decimals;

  // Format balances for user-friendly display
  const formattedBaseBalance = formatUnits(balances.base, baseDecimals);
  const formattedQuoteBalance = formatUnits(balances.quote, quoteDecimals);

  // Prompt for base token amount
  const { baseAmountMax } = (await inquirer.prompt({
    type: "input",
    name: "baseAmountMax",
    message: `Enter max ${baseSymbol} amount to add (max: ${formattedBaseBalance}):`,
    validate: (input) => {
      const num = parseFloat(input);
      if (isNaN(num) || num <= 0) {
        return "Please enter a positive number";
      }
      const rawAmount = parseUnits(input, baseDecimals);
      if (rawAmount > balances.base) {
        return `Amount exceeds your balance of ${formattedBaseBalance} ${baseSymbol}`;
      }
      return true;
    },
    filter: (input) => {
      return parseUnits(input, baseDecimals);
    },
  })) as { baseAmountMax: bigint };

  // Prompt for quote token amount
  const { quoteAmountMax } = (await inquirer.prompt({
    type: "input",
    name: "quoteAmountMax",
    message: `Enter max ${quoteSymbol} amount to add (max: ${formattedQuoteBalance}):`,
    validate: (input) => {
      const num = parseFloat(input);
      if (isNaN(num) || num <= 0) {
        return "Please enter a positive number";
      }
      const rawAmount = parseUnits(input, quoteDecimals);
      if (rawAmount > balances.quote) {
        return `Amount exceeds your balance of ${formattedQuoteBalance} ${quoteSymbol}`;
      }
      return true;
    },
    filter: (input) => {
      return parseUnits(input, quoteDecimals);
    },
  })) as { quoteAmountMax: bigint };

  // Calculate actual mint amounts based on vault state
  const spinner = ora("Getting mint amounts...").start();
  const { shares, baseAmount, quoteAmount } = await getMintAmounts(
    publicClient,
    vault,
    baseAmountMax,
    quoteAmountMax
  );
  spinner.succeed("Mint amounts fetched successfully");

  // Confirm transaction with user
  const confirm = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `The computed amounts are ${shares} shares, ${formatUnits(
      baseAmount,
      baseDecimals
    )} ${baseSymbol}, and ${formatUnits(
      quoteAmount,
      quoteDecimals
    )} ${quoteSymbol}. Are you sure you want to add these amounts?`,
  });
  if (!confirm) {
    return false;
  }
  
  // Execute the mint transaction
  const result = await mint(
    walletClient, 
    account, 
    registry.vault.MINT_HELPER, 
    vault, 
    baseAmountMax, 
    quoteAmountMax, 
    0n, // Minimum shares to receive (0 means no minimum)
    vaultData.market
  );
  return result;
}
