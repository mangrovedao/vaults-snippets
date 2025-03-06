import inquirer from "inquirer";
import { formatUnits, isAddress, parseUnits, type Address, type Client } from "viem";
import type { RegistryEntry } from "../registry";
import { getOpenMarkets } from "@mangrovedao/mgv/actions";
import type { MarketParams } from "@mangrovedao/mgv";

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
