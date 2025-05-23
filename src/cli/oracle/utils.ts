/**
 * Oracle Utilities Module
 * 
 * This module provides utility functions for oracle-related CLI operations,
 * particularly for handling vault feed configurations.
 * 
 * @module cli/oracle/utils
 */
import { erc20Abi, parseUnits, zeroAddress, type Client } from "viem";
import type { VaultFeed } from "../../oracle/chainlink/v2";
import { selectAddress, selectNumberWithDecimals } from "../select";
import ora from "ora";
import { multicall } from "viem/actions";

/**
 * Prompts the user to select a vault and configure a conversion sample
 * 
 * This function:
 * 1. Allows the user to select a vault address or use zero address
 * 2. If a valid vault is selected, fetches the token's decimals and symbol
 * 3. Prompts the user to enter a conversion sample amount
 * 
 * @param client - The blockchain client
 * @param message - The prompt message to display (default: "Choose a vault")
 * @returns A VaultFeed configuration object with vault address and conversion sample
 */
export async function requestForVaultFeed(
  client: Client,
  message: string = "Choose a vault"
): Promise<VaultFeed> {
  const vaultAddress = await selectAddress(message, zeroAddress);
  if (vaultAddress === zeroAddress) {
    return {
      vault: zeroAddress,
      conversionSample: 0n,
    };
  }
  const spinner = ora(
    `Fetching default conversion sample for ${vaultAddress}`
  ).start();
  const [decimals, symbol] = await multicall(client, {
    contracts: [
      {
        address: vaultAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: vaultAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
    allowFailure: false,
  });
  spinner.succeed(`Got ${symbol} decimals: ${decimals}`);
  const conversionSample = await selectNumberWithDecimals(
    decimals,
    `Enter a conversion sample in ${symbol}`,
    parseUnits("1", decimals)
  );
  return {
    vault: vaultAddress,
    conversionSample,
  };
}
