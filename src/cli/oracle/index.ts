import { type Client, type Address } from "viem";
import type { OracleFactory, RegistryEntry } from "../../registry";
import type { Token } from "@mangrovedao/mgv";
import inquirer from "inquirer";
import { deployChainlinkV1OracleForm } from "./chainlink/v1";
import { deployChainlinkV2OracleForm } from "./chainlink/v2";
import { deployDiaV1OracleForm } from "./dia/v1";
import { deployCombinerV1OracleForm } from "./combiner/v1";

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
