import type { RegistryEntry } from "../registry";
import inquirer from "inquirer";

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
