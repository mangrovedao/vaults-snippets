import {
  isAddress,
  type Address,
  type Client,
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

export async function deployVaultWithChoices(
  client: Client,
  market: MarketParams,
  registry: RegistryEntry,
  oracle: Address,
  sender: Address
) {
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
  await promptToSaveVault(client, vault, registry.chain.id);
  return vault;
}

export async function deployVaultAndOracle(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry,
  sender: Address
) {
  const market = await selectMarket(publicClient, registry);
  const oracle = await deployOracleForm(
    walletClient,
    registry,
    market.base,
    market.quote,
    sender
  );
  if (!oracle) {
    logger.error("Oracle deployment failed");
    return;
  }
  const vault = await deployVaultWithChoices(
    walletClient,
    market,
    registry,
    oracle,
    sender
  );
  if (!vault) {
    logger.error("Vault deployment failed");
    return;
  }
  logger.info(`Vault deployed at ${vault} with oracle ${oracle}`);
}

export async function deployVaultOnly(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry,
  sender: Address
) {
  const market = await selectMarket(publicClient, registry);
  const oracle = await selectAddress("Enter the oracle address");
  const vault = await deployVaultWithChoices(
    walletClient,
    market,
    registry,
    oracle,
    sender
  );
  if (!vault) {
    logger.error("Vault deployment failed");
    return;
  }
  logger.info(`Vault deployed at ${vault} with oracle ${oracle}`);
}
