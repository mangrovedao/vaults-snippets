/**
 * Vault Deployment Module
 *
 * This module provides functionality for deploying vaults through an interactive CLI.
 * It supports deploying vaults with or without oracle deployment in the same workflow.
 */
import {
  isAddress,
  type Address,
  type Client,
  type PrivateKeyAccount,
  type PublicClient,
  type WalletClient,
} from "viem";
import type { RegistryEntry } from "../../registry";
import inquirer from "inquirer";
import type { MarketParams } from "@mangrovedao/mgv";
import { logger } from "../../utils/logger";
import { deployVault } from "../../vault/factory";
import { promptToSaveVault, selectAddress, selectMarket } from "../select";
import { deployOracleForm } from "../oracle";
import { vaultManagement } from "./management";

/**
 * Deploys a vault with user-selected configuration options
 *
 * This function:
 * 1. Prompts the user for vault configuration parameters (seeder, owner, name, symbol, decimals)
 * 2. Confirms the deployment parameters with the user
 * 3. Deploys the vault with the specified parameters
 * 4. Prompts the user to save the vault address
 *
 * @param client - The blockchain client
 * @param market - The market parameters for the vault
 * @param registry - The registry entry containing contract addresses and chain information
 * @param oracle - The address of the oracle to use with the vault
 * @param sender - The sender's address
 * @returns The address of the deployed vault or false if deployment failed or was cancelled
 */
export async function deployVaultWithChoices(
  client: Client,
  market: MarketParams,
  registry: RegistryEntry,
  oracle: Address,
  sender: Address
) {
  // Prompt user for vault configuration parameters
  const { seeder, owner, name, symbol, decimals } = (await inquirer.prompt([
    {
      type: "select",
      message: "Select a seeder to use",
      name: "seeder",
      choices: Object.keys(registry.vault.SIMPLE_VAULTS_SEEDER).map(
        (seeder) => ({
          value: registry.vault.SIMPLE_VAULTS_SEEDER[seeder],
          name: seeder,
        })
      ),
    },
    {
      type: "input",
      message: "Choose the initial vault owner",
      name: "owner",
      default: sender,
      validate: (value: string | undefined) => {
        if (value && isAddress(value)) {
          return true;
        }
        return "Invalid address";
      },
    },
    {
      type: "input",
      message: "Choose the vault name",
      name: "name",
      validate: (value: string | undefined) => {
        if (value) {
          return true;
        }
        return "Invalid name";
      },
    },
    {
      type: "input",
      message: "Choose the vault symbol",
      name: "symbol",
      validate: (value: string | undefined) => {
        if (value) {
          return true;
        }
        return "Invalid symbol";
      },
    },
    {
      type: "number",
      message: "Choose the number of decimals",
      name: "decimals",
      default: 18,
      validate: (value: number | undefined) => {
        if (value && value > 5 && value <= 18) {
          return true;
        }
        return "Invalid number of decimals, must be between 6 and 18";
      },
    },
  ])) as {
    seeder: Address;
    owner: Address;
    name: string;
    symbol: string;
    decimals: number;
  };

  // Confirm deployment parameters with user
  const { confirm } = (await inquirer.prompt([
    {
      type: "confirm",
      message: `Deploy vault with the following parameters?
      Seeder: ${seeder}
      Owner: ${owner}
      Name: ${name}
      Symbol: ${symbol}
      Decimals: ${decimals}
      Oracle: ${oracle}
      Market: ${market.base.symbol}/${market.quote.symbol} (tickSpacing: ${market.tickSpacing})
      `,
      name: "confirm",
      default: true,
    },
  ])) as { confirm: boolean };

  if (!confirm) {
    logger.info("Vault deployment cancelled");
    return false;
  }

  // Deploy the vault with specified parameters
  const vault = await deployVault(
    client,
    registry.vault.VAULT_FACTORY,
    sender,
    {
      seeder,
      base: market.base.address,
      quote: market.quote.address,
      tickSpacing: market.tickSpacing,
      oracle,
      name,
      symbol,
      decimals,
    }
  );

  if (!vault) {
    logger.error("Vault deployment failed");
    return false;
  }

  // Prompt user to save the vault address
  await promptToSaveVault(client, vault, registry.chain.id);
  return vault;
}

/**
 * Deploys a vault using an existing oracle
 *
 * This function:
 * 1. Prompts the user to select a market
 * 2. Prompts the user to enter an existing oracle address
 * 3. Deploys a vault for the selected market using the specified oracle
 *
 * @param publicClient - The public blockchain client for reading data
 * @param walletClient - The wallet client for signing transactions
 * @param registry - The registry entry containing contract addresses and chain information
 * @param sender - The sender's address
 */
export async function deployVaultOnly(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry,
  account: PrivateKeyAccount
) {
  // Select market and existing oracle
  const market = await selectMarket(publicClient, registry);
  const oracle = await selectAddress("Enter the oracle address");

  // Deploy vault with the specified oracle
  const vault = await deployVaultWithChoices(
    walletClient,
    market,
    registry,
    oracle,
    account.address
  );
  if (!vault) {
    logger.error("Vault deployment failed");
    return;
  }
  logger.info(`Vault deployed at ${vault} with oracle ${oracle}`);
  await vaultManagement(publicClient, walletClient, registry, account, vault);
}
