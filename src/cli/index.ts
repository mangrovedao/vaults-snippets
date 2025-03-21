/**
 * Main CLI entry point for the Mangrove Vaults Tool.
 *
 * This file serves as the application entry point that provides a command-line interface
 * for interacting with Mangrove Vaults, including creating, viewing, and managing vaults
 * and their associated oracles.
 *
 * @module cli
 */
import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "../utils/logger";
import { chooseChain } from "./chain";
import { registry } from "../registry";
import { selectFromEnum } from "./select";
import { deployVaultOnly, vaultManagement } from "./vault";
import { deployOracleForm } from "./oracle";

const MainMenuActions = {
  VAULT_MANAGEMENT: "Vault Management",
  CREATE_VAULT: "Create Vault",
  CREATE_ORACLE: "Create Oracle",
  EXIT: "Exit",
} as const;

/**
 * Main function that serves as the entry point for the CLI application.
 *
 * This function performs the following steps:
 * 1. Sets up the account using the private key from environment variables
 * 2. Prompts the user to select a blockchain to work with
 * 3. Prompts the user to select an action to perform
 * 4. Creates the necessary clients and executes the selected action
 *
 * @returns A promise that resolves when the application completes
 */
async function main() {
  const account = privateKeyToAccount(process.env.PRIVATE_KEY! as Hex);
  logger.info(`Using account ${account.address}`);

  await new Promise((resolve) => setTimeout(resolve, 50));

  const chain = await chooseChain(registry);

  const publicClient = createPublicClient({
    chain: chain.chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: chain.chain,
    transport: http(),
  });

  while (true) {
    const action = await selectFromEnum(
      "What do you want to do?",
      MainMenuActions
    );
    switch (action) {
      case MainMenuActions.VAULT_MANAGEMENT:
        await vaultManagement(publicClient, walletClient, chain, account);
        break;
      case MainMenuActions.CREATE_VAULT:
        await deployVaultOnly(publicClient, walletClient, chain, account);
        break;
      case MainMenuActions.CREATE_ORACLE:
        await deployOracleForm(walletClient, chain, account.address);
        break;
      case MainMenuActions.EXIT:
        logger.info("Exiting...");
        process.exit(0);
      default:
        logger.error("Invalid action");
        break;
    }
  }
}

main()
  .catch(logger.error)
  .then(() => process.exit(0));
