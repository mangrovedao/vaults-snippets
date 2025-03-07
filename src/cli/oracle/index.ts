/**
 * Oracle CLI Module
 * 
 * This module provides the command-line interface for deploying and interacting with
 * different types of oracles (Chainlink, DIA, Combiner). It serves as the entry point
 * for all oracle-related CLI operations.
 * 
 * @module cli/oracle
 */
import { type Client, type Address } from "viem";
import type { OracleFactory, RegistryEntry } from "../../registry";
import type { Token } from "@mangrovedao/mgv";
import inquirer from "inquirer";
import { deployChainlinkV1OracleForm } from "./chainlink/v1";
import { deployChainlinkV2OracleForm } from "./chainlink/v2";
import { deployDiaV1OracleForm } from "./dia/v1";
import { deployCombinerV1OracleForm } from "./combiner/v1";

/**
 * Prompts the user to select an oracle factory from the available options
 * 
 * @param registry - The blockchain registry entry containing oracle factory configurations
 * @returns The selected oracle factory configuration
 */
async function chooseOracleFactory(
  registry: RegistryEntry
): Promise<OracleFactory> {
  const { factory } = await inquirer.prompt({
    type: "list",
    name: "factory",
    message: "Choose an oracle factory",
    choices: Object.entries(registry.vault.ORACLE_FACTORIES).map(
      ([key, value]) => ({
        name: key,
        value,
      })
    ),
  }) as { factory: OracleFactory };
  return factory;
}

/**
 * Main function for deploying an oracle through the CLI
 * 
 * This function:
 * 1. Prompts the user to select an oracle factory
 * 2. Routes to the appropriate oracle deployment form based on the factory type
 * 
 * @param client - The blockchain client
 * @param registry - The blockchain registry entry
 * @param base - The base token
 * @param quote - The quote token
 * @param sender - The sender's address
 * @returns The address of the deployed oracle, or false if deployment failed or was cancelled
 */
export async function deployOracleForm(
  client: Client,
  registry: RegistryEntry,
  base: Token,
  quote: Token,
  sender: Address
) {
  const factory = await chooseOracleFactory(registry);
  switch (factory.type) {
    case "chainlinkv1":
      return deployChainlinkV1OracleForm(client, base, quote, factory.oracleFactory, sender, registry.chainlinkMetadataLink);
    case "chainlinkv2":
      return deployChainlinkV2OracleForm(client, base, quote, factory.oracleFactory, registry.chainlinkMetadataLink);
    case "diav1":
      return deployDiaV1OracleForm(client, base, quote, factory.oracleFactory);
    case "combinerv1":
      return deployCombinerV1OracleForm(client, factory.oracleFactory);
  }
}
