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
import { PossibleActions, selectAction, selectMarket } from "./select";
import { deployVaultAndOracle, deployVaultOnly, viewVault } from "./vault";
import { editVault } from "./vault/edit";
import { addLiquidity } from "./vault/add-liquidity";
import { removeLiquidity } from "./vault/remove-liquidity";
import { deployOracleForm } from "./oracle";
import { rebalanceForm } from "./rebalance.ts";

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
  const action = await selectAction();

  const publicClient = createPublicClient({
    chain: chain.chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: chain.chain,
    transport: http(),
  });

  switch (action) {
    case PossibleActions.CREATE_VAULT_FROM_ORACLE:
      await deployVaultOnly(publicClient, walletClient, chain, account.address);
      break;
    case PossibleActions.CREATE_VAULT_FROM_SCRATCH:
      await deployVaultAndOracle(
        publicClient,
        walletClient,
        chain,
        account.address
      );
      break;
    case PossibleActions.VIEW_VAULT:
      await viewVault(publicClient, chain);
      break;
    case PossibleActions.EDIT_VAULT:
      await editVault(publicClient, walletClient, chain);
      break;
    case PossibleActions.ADD_LIQUIDITY:
      await addLiquidity(publicClient, walletClient, account.address, chain);
      break;
    case PossibleActions.REMOVE_LIQUIDITY:
      await removeLiquidity(publicClient, walletClient, account.address, chain);
      break;
    case PossibleActions.DEPLOY_ORACLE:
      const market = await selectMarket(publicClient, chain);
      await deployOracleForm(
        walletClient,
        chain,
        market.base,
        market.quote,
        account.address
      );
      break;
    case PossibleActions.REBALANCE:
      await rebalanceForm(walletClient, chain, account.address);
      break;
  }
}

main()
  .catch(logger.error)
  .then(() => process.exit(0));
