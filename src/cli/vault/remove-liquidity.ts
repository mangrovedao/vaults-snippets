import {
  type Address,
  type PublicClient,
  type WalletClient,
} from "viem";
import type { RegistryEntry } from "../../registry";
import { getCurrentVaultState } from "../../vault/read";
import { getBalanceForToken } from "../balances";
import { selectAddress, selectVault } from "../select";
import ora from "ora";
import inquirer from "inquirer";
import { burn } from "../../vault/burn";

export async function removeLiquidity(
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
  loader.text = "Fetching vault LP balance...";
  const balance = await getBalanceForToken(publicClient, account, vault);
  loader.succeed("Data fetched successfully");
  const { shares } = await inquirer.prompt({
    type: "input",
    name: "shares",
    message: `Enter the number of shares to remove (max: ${balance}) or a percentage (e.g. 50%):`,
    validate: (input) => {
      if (input.endsWith("%")) {
        const percentage = parseFloat(input.slice(0, -1));
        if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
          return "Please enter a valid percentage between 0 and 100";
        }
        if (percentage % 1 !== 0) {
          return "Please enter a whole number percentage";
        }
      } else {
        const num = parseFloat(input);
        if (isNaN(num) || num <= 0) {
          return "Please enter a positive number";
        }
        if (num % 1 !== 0) {
          return "Please enter a whole number";
        }
      }
      return true;
    },
    filter: (input) => {
      if (input.endsWith("%")) {
        // Handle percentage input
        const percentage = BigInt(input.slice(0, -1));
        return (balance * percentage) / 100n;
      }
      // Regular input handling
      return BigInt(input);
    },
  }) as { shares: bigint };

  return burn(walletClient, vault, shares, 0n, 0n, vaultData.market);
}
