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
import { getCurrentVaultState } from "../vault/read";
import { readContract } from "viem/actions";

export enum PossibleActions {
  CREATE_VAULT_FROM_ORACLE = "Create vault from oracle",
  CREATE_VAULT_FROM_SCRATCH = "Create vault from scratch",
  DEPLOY_ORACLE = "Deploy oracle",
  VIEW_VAULT = "View vault",
  EDIT_VAULT = "Edit vault",
  ADD_LIQUIDITY = "Add liquidity",
  REMOVE_LIQUIDITY = "Remove liquidity",
}

export async function selectAction() {
  const { action } = (await inquirer.prompt([
    {
      type: "list",
      choices: Object.values(PossibleActions),
      message: "Select an action",
      name: "action",
    },
  ])) as { action: PossibleActions };
  return action;
}

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

export async function selectNumberWithDecimals(
  decimals: number,
  message: string = "Enter a value (in decimal)",
  defaultValue: bigint = 0n
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

type SaveFile = z.infer<typeof SaveFileSchema>;
type SavedVault = z.infer<typeof SavedVaultV1Schema>;

const SAVE_FILE = ".save/vaults.json";

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

async function saveVault(vault: SavedVault) {
  const currentContent = await loadSavedVaults();
  currentContent.vaults.push(vault);
  await Bun.write(SAVE_FILE, JSON.stringify(currentContent, null, 2));
}

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
