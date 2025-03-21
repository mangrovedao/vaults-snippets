import type { Address, PrivateKeyAccount, PublicClient, WalletClient } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectFromEnum, selectVault } from "../select";
import { viewVault } from "./view";
import { getCurrentVaultState } from "../../vault/read";
import ora from "ora";
import { editFee, editPosition, editPriceRange } from "./edit";
import { addLiquidity } from "./add-liquidity";
import { removeLiquidity } from "./remove-liquidity";
import { rebalanceForm } from "../rebalance";
import { logger } from "../../utils/logger";

const VaultManagementAction = {
  VIEW_VAULT: "View Vault",
  CHANGE_FEE_DATA: "Change Fee Data",
  CHOOSE_PRICE_RANGE: "Choose Price Range",
  CHANGE_POSITION_DATA: "Change Position Data",
  ADD_LIQUIDITY: "Add Liquidity",
  REMOVE_LIQUIDITY: "Remove Liquidity",
  REBALANCE: "Rebalance",
  EXIT: "Exit",
} as const;

export async function vaultManagement(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry,
  account: PrivateKeyAccount,
  _vault?: Address
) {
  const vault = _vault ?? await selectVault(publicClient, registry.chain.id);
  while (true) {
    const vaultStatePromise = getCurrentVaultState(
      publicClient,
      vault,
      registry.mangrove
    );
    const action = await selectFromEnum(
      "What do you want to do?",
      VaultManagementAction
    );

    const spinner = ora("Fetching vault state...").start();
    const vaultState = await vaultStatePromise;
    spinner.succeed("Vault state fetched");

    switch (action) {
      case VaultManagementAction.VIEW_VAULT:
        await viewVault(publicClient, registry, vault, vaultState);
        break;
      case VaultManagementAction.CHANGE_FEE_DATA:
        await editFee(walletClient, vault, vaultState.feeData);
        break;
      case VaultManagementAction.CHOOSE_PRICE_RANGE:
        await editPriceRange(walletClient, vault, vaultState);
        break;
      case VaultManagementAction.CHANGE_POSITION_DATA:
        await editPosition(walletClient, vault, vaultState.position);
        break;
      case VaultManagementAction.ADD_LIQUIDITY:
        await addLiquidity(
          publicClient,
          walletClient,
          account.address,
          registry,
          vault,
          vaultState
        );
        break;
      case VaultManagementAction.REMOVE_LIQUIDITY:
        await removeLiquidity(
          publicClient,
          walletClient,
          account.address,
          registry,
          vault,
          vaultState
        );
        break;
      case VaultManagementAction.REBALANCE:
        await rebalanceForm(
          walletClient,
          registry,
          account.address,
          vault,
          vaultState
        );
        break;
      case VaultManagementAction.EXIT:
        return;
    }
  }
}
