import type { Address, PublicClient, WalletClient } from "viem";
import { selectAddress, type SavedVault } from "../select";
import type { RegistryEntry } from "../../registry";
import type { CurrentVaultState } from "../../vault/read";
import { multicall, simulateContract } from "viem/actions";
import { ERC4626VaultAbi } from "../../../abis/ERC4626VaultAbi";
import { logger } from "../../utils/logger";

export async function editERC4626Vaults(
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Address,
  registry: RegistryEntry,
  vault: SavedVault,
  vaultState?: CurrentVaultState
) {
  let currentBaseVault = vaultState?.baseVault;
  let currentQuoteVault = vaultState?.quoteVault;

  let base = vaultState?.market.base.address;
  let quote = vaultState?.market.quote.address;

  if (!currentBaseVault || !currentQuoteVault || !base || !quote) {
    const [[baseVault, quoteVault], [_base, _quote]] = await multicall(
      publicClient,
      {
        allowFailure: false,
        contracts: [
          {
            address: vault.address,
            abi: ERC4626VaultAbi,
            functionName: "currentVaults",
          },
          {
            address: vault.address,
            abi: ERC4626VaultAbi,
            functionName: "market",
          },
        ],
      }
    );
    currentBaseVault = baseVault;
    currentQuoteVault = quoteVault;
    base = _base;
    quote = _quote;
  }

  logger.info(`Current base vault: ${currentBaseVault}`);
  logger.info(`Current quote vault: ${currentQuoteVault}`);

  const newBaseVault = await selectAddress(
    "Select new base vault",
    currentBaseVault
  );
  const newQuoteVault = await selectAddress(
    "Select new quote vault",
    currentQuoteVault
  );

  if (
    newBaseVault === currentBaseVault &&
    newQuoteVault === currentQuoteVault
  ) {
    logger.info("No changes made");
    return;
  }

  if (newBaseVault !== currentBaseVault) {
    const { request } = await simulateContract(walletClient, {
      address: vault.address,
      abi: ERC4626VaultAbi,
      functionName: "setVaultForToken",
      args: [base, newBaseVault, 0n, 0n],
      account: walletClient.account!,
    });
    await logger.handleRequest(request, walletClient, {
      header: `setting base vault to ${newBaseVault}`,
      success: (block, hash) =>
        `set base vault to ${newBaseVault} in block ${block}: ${hash}`,
      failure: (hash) => `set base vault to ${newBaseVault} failed: ${hash}`,
      label: "Setting base vault",
    });
  }

  if (newQuoteVault !== currentQuoteVault) {
    const { request } = await simulateContract(walletClient, {
      address: vault.address,
      abi: ERC4626VaultAbi,
      functionName: "setVaultForToken",
      args: [quote, newQuoteVault, 0n, 0n],
      account: walletClient.account!,
    });
    await logger.handleRequest(request, walletClient, {
      header: `setting quote vault to ${newQuoteVault}`,
      success: (block, hash) =>
        `set quote vault to ${newQuoteVault} in block ${block}: ${hash}`,
      failure: (hash) => `set quote vault to ${newQuoteVault} failed: ${hash}`,
      label: "Setting quote vault",
    });
  }
}
