/**
 * CLI Selection Module
 *
 * This module provides various selection utilities for the CLI interface,
 * including selecting actions, markets, addresses, numerical values, and vaults.
 * It also handles saving and loading vault information for user convenience.
 *
 * @module cli/select
 */
import inquirer from "inquirer";
import {
  erc20Abi,
  formatUnits,
  isAddress,
  parseUnits,
  type Address,
  type Client,
} from "viem";
import type { RegistryEntry } from "../registry";
import { getOpenMarkets } from "@mangrovedao/mgv/actions";
import type { MarketParams } from "@mangrovedao/mgv";
import { z } from "zod";
import { logger } from "../utils/logger";
import { readContract } from "viem/actions";

/**
 * Prompts the user to select a market from the available options on Mangrove
 *
 * Fetches open markets from the Mangrove protocol and presents them to the user for selection.
 *
 * @param client - The blockchain client
 * @param registry - The blockchain registry entry
 * @returns The selected market parameters
 */
export async function selectMarket(client: Client, registry: RegistryEntry) {
  const markets = await getOpenMarkets(client, registry.mangrove, {
    cashnesses: {
      WETH: 1000,
      WBTC: 2000,
      USDC: 1e6,
      USDT: 2e6,
      EURC: 0.5e6,
      cbBTC: 2000,
      cbETH: 500,
      wstETH: 600,
    },
    symbolOverrides: {
      "USD₮0": "USDT",
    },
  });

  const { market } = (await inquirer.prompt([
    {
      type: "list",
      choices: markets.map((m) => ({
        value: m,
        name: `${m.base.symbol}/${m.quote.symbol} (tickSpacing: ${m.tickSpacing})`,
      })),
      message: "Select a market",
      name: "market",
    },
  ])) as { market: MarketParams };
  return market;
}

/**
 * Prompts the user to enter an Ethereum address
 *
 * Validates that the input is a valid Ethereum address.
 *
 * @param message - The prompt message (default: "Enter an address")
 * @param defaultValue - Optional default address value
 * @returns The entered or selected address
 */
export async function selectAddress(
  message: string = "Enter an address",
  defaultValue?: Address
) {
  const { address } = (await inquirer.prompt([
    {
      type: "input",
      message,
      name: "address",
      default: defaultValue,
      validate: (value: string | undefined) => {
        if (value && isAddress(value)) {
          return true;
        }
        return "Please enter a valid Ethereum address";
      },
    },
  ])) as { address: Address };
  return address;
}

/**
 * Prompts the user to enter a number with decimal precision
 *
 * Handles conversion between the decimal representation and the bigint value
 * with the appropriate number of decimals.
 *
 * @param decimals - The number of decimal places
 * @param message - The prompt message (default: "Enter a value (in decimal)")
 * @param defaultValue - Optional default value
 * @returns The entered value as a bigint
 */
export async function selectNumberWithDecimals(
  decimals: number,
  message: string = "Enter a value (in decimal)",
  defaultValue: bigint = 0n,
  maxValue?: bigint
) {
  const { number } = (await inquirer.prompt({
    type: "input",
    message,
    name: "number",
    default: formatUnits(defaultValue, decimals),
    validate: (value: string | undefined) => {
      if (value === undefined) return "Please enter a value";
      const number = parseUnits(value, decimals);
      if (number < 0n) return "Please enter a positive number";
      if (maxValue && number > maxValue)
        return `Please enter a value less than ${formatUnits(
          maxValue,
          decimals
        )}`;
      return true;
    },
    filter: (value: string) => parseUnits(value, decimals),
  })) as { number: bigint };
  return number;
}

const SavedVaultV1Schema = z.object({
  address: z.custom<Address>((r) => typeof r === "string" && isAddress(r)),
  name: z.string(),
  chainId: z.number(),
  label: z.string().optional(),
});

const SaveFileSchema = z.object({
  version: z.literal(1),
  vaults: z.array(SavedVaultV1Schema),
});

/**
 * Schema for the saved vault file
 */
type SaveFile = z.infer<typeof SaveFileSchema>;

/**
 * Schema for a saved vault entry
 */
type SavedVault = z.infer<typeof SavedVaultV1Schema>;

const SAVE_FILE = ".save/vaults.json";

/**
 * Loads previously saved vaults from storage
 *
 * @returns The saved vault information
 */
async function loadSavedVaults(): Promise<SaveFile> {
  const file = Bun.file(SAVE_FILE);
  if (!(await file.exists())) {
    return {
      version: 1,
      vaults: [],
    };
  }
  const content = await file.json();
  const result = SaveFileSchema.safeParse(content);
  if (!result.success) {
    logger.error("Invalid save file", result.error);
    return {
      version: 1,
      vaults: [],
    };
  }
  return result.data;
}

/**
 * Saves a vault to storage for future reference
 *
 * @param vault - The vault information to save
 */
async function saveVault(vault: SavedVault) {
  const currentContent = await loadSavedVaults();
  currentContent.vaults.push(vault);
  await Bun.write(SAVE_FILE, JSON.stringify(currentContent, null, 2));
}

/**
 * Prompts the user to save a vault for future reference
 *
 * Fetches the vault's name and symbol from the blockchain and saves it along with the address.
 *
 * @param client - The blockchain client
 * @param address - The address of the vault
 * @param chainId - The ID of the blockchain network
 * @returns Whether the vault was saved
 */
export async function promptToSaveVault(
  client: Client,
  address: Address,
  chainId: number
) {
  const { shouldSave } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldSave",
      message: "Do you want to save this vault for future use?",
      default: true,
    },
  ]);

  if (shouldSave) {
    try {
      const vaultNamePromise = readContract(client, {
        address,
        abi: erc20Abi,
        functionName: "name",
      });
      const { label } = await inquirer.prompt([
        {
          type: "input",
          name: "label",
          message: "Enter an optional label for this vault:",
        },
      ]);
      const vaultName = await vaultNamePromise;

      const savedVault: SavedVault = {
        address,
        name: vaultName,
        chainId,
        ...(label ? { label } : {}),
      };

      await saveVault(savedVault);
    } catch (error) {
      logger.error("Failed to save vault:", error);
    }
  }
}

/**
 * Prompts the user to select a vault from previously saved vaults
 *
 * If no vaults have been saved on the selected chain, allows entering a vault address directly.
 *
 * @param client - The blockchain client
 * @param chainId - The ID of the blockchain network
 * @param message - The prompt message (default: "Select a vault")
 * @returns The address of the selected vault
 */
export async function selectVault(
  client: Client,
  chainId: number,
  message: string = "Select a vault"
) {
  const savedVaults = (await loadSavedVaults()).vaults.filter(
    (v) => v.chainId === chainId
  );

  if (savedVaults.length > 0) {
    const { useSaved } = await inquirer.prompt([
      {
        type: "confirm",
        name: "useSaved",
        message: "Do you want to use a saved vault?",
        default: true,
      },
    ]);

    if (useSaved) {
      const { vault } = await inquirer.prompt([
        {
          type: "list",
          name: "vault",
          message,
          choices: savedVaults.map((v) => ({
            name: v.label
              ? `${v.name} (${v.label}) - ${v.address}`
              : `${v.name} - ${v.address}`,
            value: v.address,
          })),
        },
      ]);

      return vault as Address;
    }
  }

  // If no saved vaults or user chose not to use them
  const address = await selectAddress(message);
  await promptToSaveVault(client, address, chainId);
  return address;
}

export async function selectFromEnum<TChoices extends string>(
  message: string,
  choices: Record<string, TChoices>
) {
  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message,
      choices: Object.values(choices),
    },
  ]);
  return choice as TChoices;
}
