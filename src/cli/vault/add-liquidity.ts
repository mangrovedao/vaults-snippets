import type { Address, PublicClient, WalletClient } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectAddress, selectVault } from "../select";
import { getCurrentVaultState } from "../../vault/read";
import ora from "ora";
import { getBalancesForMarket } from "../balances";
import inquirer from "inquirer";
import { formatUnits, parseUnits } from "viem";
import { getMintAmounts } from "../../vault/mint/get-mint-amount";
import { mint } from "../../vault/mint/mint";

export async function addLiquidity(
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Address,
  registry: RegistryEntry
) {
  const vault = await selectVault(publicClient, registry.chain.id);
  const loader = ora("Getting vault state...").start();
  const vaultData = await getCurrentVaultState(
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

  const baseSymbol = vaultData.market.base.symbol;
  const quoteSymbol = vaultData.market.quote.symbol;
  const baseDecimals = vaultData.market.base.decimals;
  const quoteDecimals = vaultData.market.quote.decimals;

  const formattedBaseBalance = formatUnits(balances.base, baseDecimals);
  const formattedQuoteBalance = formatUnits(balances.quote, quoteDecimals);

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

  const spinner = ora("Getting mint amounts...").start();
  const { shares, baseAmount, quoteAmount } = await getMintAmounts(
    publicClient,
    vault,
    baseAmountMax,
    quoteAmountMax
  );
  spinner.succeed("Mint amounts fetched successfully");

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
  const result = await mint(walletClient, account, registry.vault.MINT_HELPER, vault, baseAmountMax ,quoteAmountMax, 0n, vaultData.market)
  return result;
}
