import type { Address, Client } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectVault } from "../select";
import { getCurrentVaultState } from "../../vault/read";
import inquirer from "inquirer";
import { logger } from "../../utils/logger";
import { rebalanceOdos } from "./odos";

export enum RebalanceType {
  ODOS = "Odos protocol",
}

export async function rebalanceForm(client: Client, registry: RegistryEntry, sender: Address) {
  const vault = await selectVault(client, registry.chain.id);

  const statePromise = getCurrentVaultState(client, vault, registry.mangrove);

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
  ])) as { rebalanceType: (typeof registry.rebalance)[keyof typeof registry.rebalance] };
  const state = await statePromise;

  console.log(rebalanceType);

  // Continue with rebalance process based on selected type
  switch (rebalanceType.type) {
    case "odos":
      // Handle Odos rebalance flow
      return await rebalanceOdos(client, vault, state, rebalanceType, registry, sender);
    default:
      logger.error("Unsupported rebalance type selected");
      return false;
  }
}
