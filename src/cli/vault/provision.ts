import {
  formatEther,
  parseEther,
  type PublicClient,
  type WalletClient,
} from "viem";

import type { Address } from "viem";
import type { SavedVault } from "../select";
import type { CurrentVaultState } from "../../vault/read";
import { logger } from "../../utils/logger";
import inquirer from "inquirer";
import ora from "ora";
import { getBalance, simulateContract } from "viem/actions";
import { ERC4626VaultAbi } from "../../../abis/ERC4626VaultAbi";

export async function addProvision(
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Address,
  vault: SavedVault,
  vaultState?: CurrentVaultState
) {
  if (vaultState) {
    logger.info(
      `Current total provision: ${vaultState.kandelState.totalProvision}`
    );
  }

  const loader = ora("Getting the user balance").start();
  const balance = await getBalance(publicClient, {
    address: account,
  });
  loader.succeed("User balance fetched successfully");

  const { amount } = (await inquirer.prompt({
    type: "input",
    name: "amount",
    message: `Enter amount to add (max: ${formatEther(balance)}):`,
    validate: (input) => {
      const num = parseFloat(input);
      if (isNaN(num) || num <= 0) {
        return "Please enter a positive number";
      }
      const rawAmount = parseEther(input);
      if (rawAmount > balance) {
        return `Amount exceeds your balance of ${formatEther(balance)}`;
      }
      return true;
    },
    filter: (input) => {
      return parseEther(input);
    },
  })) as { amount: bigint };

  const { request } = await simulateContract(walletClient, {
    address: vault.address,
    abi: ERC4626VaultAbi,
    functionName: "fundMangrove",
    value: amount,
    account: walletClient.account!,
  });

  await logger.handleRequest(request, walletClient, {
    header: `funding mangrove with ${formatEther(amount)}`,
    success: (block, hash) =>
      `funded mangrove with ${formatEther(amount)} in block ${block}: ${hash}`,
    failure: (hash) =>
      `funding mangrove with ${formatEther(amount)} failed: ${hash}`,
    label: "Funding mangrove",
  });
}


export async function removeProvision(
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Address,
  vault: SavedVault,
  vaultState: CurrentVaultState
) {

  const { amount } = (await inquirer.prompt({
    type: "input",
    name: "amount",
    message: `Enter amount to remove (max: ${formatEther(vaultState.kandelState.unlockedProvision)}):`,
    validate: (input) => {
      const num = parseFloat(input);
      if (isNaN(num) || num <= 0) {
        return "Please enter a positive number";
      }
      const rawAmount = parseEther(input);
      if (rawAmount > vaultState.kandelState.unlockedProvision) {
        return `Amount exceeds your unlocked provision of ${formatEther(vaultState.kandelState.unlockedProvision)}`;
      }
      return true;
    },
    filter: (input) => {
      return parseEther(input);
    },
  })) as { amount: bigint };

  const { request } = await simulateContract(walletClient, {
    address: vault.address,
    abi: ERC4626VaultAbi,
    functionName: "withdrawFromMangrove",
    args: [amount, account],
    account: walletClient.account!,
  });

  await logger.handleRequest(request, walletClient, {
    header: `withdrawing ${formatEther(amount)} from mangrove`,
    success: (block, hash) =>
      `withdrew ${formatEther(amount)} from mangrove in block ${block}: ${hash}`,
    failure: (hash) =>
      `withdrawing ${formatEther(amount)} from mangrove failed: ${hash}`,
    label: "Withdrawing from mangrove",
  });
}