/**
 * Chain Selection Module
 * 
 * This module provides functionality for the user to select which blockchain
 * network they want to interact with from the available options in the registry.
 * 
 * @module cli/chain
 */
import type { RegistryEntry } from "../registry";
import inquirer from "inquirer";

/**
 * Prompts the user to select a blockchain network from the available options
 * 
 * Displays a list of available chains from the registry and returns the
 * selected chain's configuration entry.
 * 
 * @param registry - Array of available blockchain configurations
 * @returns The selected blockchain configuration entry
 */
export async function chooseChain(registry: RegistryEntry[]) {
  const { chain } = (await inquirer.prompt([
    {
      type: "list",
      choices: registry.map((r) => ({
        name: r.chain.name,
        value: r,
      })),
      message: "Select a chain",
      name: "chain",
    },
  ])) as { chain: RegistryEntry };

  return chain;
}
