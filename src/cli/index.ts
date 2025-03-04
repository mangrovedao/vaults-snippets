import { createPublicClient, createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "../utils/logger";
import { chooseChain } from "./chain";
import { registry } from "../registry";
import { PossibleActions, selectAction } from "./select";
import { deployVaultAndOracle, deployVaultOnly, viewVault } from "./vault";
import { editVault } from "./vault/edit";
import { addLiquidity } from "./vault/add-liquidity";

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
  }
}

main()
  .catch(logger.error)
  .then(() => process.exit(0));
