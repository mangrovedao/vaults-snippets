import type { Address, Client } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectVault, type SavedVault } from "../select";
import { getCurrentVaultState, type CurrentVaultState } from "../../vault/read";
import inquirer from "inquirer";
import { logger } from "../../utils/logger";
import { rebalanceOdos } from "./odos";
import { rebalanceKame } from "./kame";
import { rebalanceSymphony } from "./symphony";

export enum RebalanceType {
  ODOS = "Odos protocol",
  KAME = "Kame protocol",
  SYMPHONY = "Symphony protocol",
}

export async function rebalanceForm(
  client: Client,
  registry: RegistryEntry,
  sender: Address,
  vault?: SavedVault,
  vaultState?: CurrentVaultState
) {
  if (!vault) {
    vault = await selectVault(client, registry.chain.id);
  }
  if (!vault) {
    logger.error("No vault selected");
    return;
  }

  const statePromise = vaultState
    ? Promise.resolve(vaultState)
    : getCurrentVaultState(client, vault, registry.mangrove);

  // Prompt the user to select the rebalance type
  const { rebalanceType } = (await inquirer.prompt([
    {
      type: "list",
      name: "rebalanceType",
      message: "Select the rebalance protocol to use:",
      choices: Object.entries(registry.rebalance).map(([key, value]) => ({
        name: key,
        value,
      })),
    },
  ])) as {
    rebalanceType: (typeof registry.rebalance)[keyof typeof registry.rebalance];
  };
  const state = await statePromise;

  console.log(rebalanceType);

  // Continue with rebalance process based on selected type
  switch (rebalanceType.type) {
    case "odos":
      // Handle Odos rebalance flow
      return await rebalanceOdos(
        client,
        vault.address,
        state,
        rebalanceType,
        registry,
        sender
      );
    case "kame":
      // Handle Kame rebalance flow
      return await rebalanceKame(
        client,
        vault.address,
        state,
        rebalanceType,
        registry,
        sender
      );
    case "symphony":
      // Handle Symphony rebalance flow
      return await rebalanceSymphony(
        client,
        vault.address,
        state,
        rebalanceType,
        registry,
        sender
      );
    default:
      logger.error("Unsupported rebalance type selected");
      return false;
  }
}
