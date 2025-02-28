import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "../utils/logger";
import { chooseChain } from "./chain";
import { registry, type RegistryEntry } from "../registry";
import {
  PossibleActions,
  selectAction,
  selectAddress,
  selectMarket,
} from "./select";
import { getFeeds } from "../oracle/chainlink/get-feeds";
import { chooseFeed } from "./chainlink/chose-feed";
import { deployOracleWithChoice } from "./chainlink/deployOracle";
import { deployVaultWithChoices } from "./vault";

async function deployVaultAndOracle(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry,
  sender: Address
) {
  const market = await selectMarket(publicClient, registry);
  const oracle = await deployOracleWithChoice(
    walletClient,
    market.base,
    market.quote,
    registry,
    sender
  );
  if (!oracle) {
    logger.error("Oracle deployment failed");
    return;
  }
  const vault = await deployVaultWithChoices(
    walletClient,
    market,
    registry,
    oracle,
    sender
  );
  if (!vault) {
    logger.error("Vault deployment failed");
    return;
  }
  logger.info(`Vault deployed at ${vault} with oracle ${oracle}`);
}

async function deployVaultOnly(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry,
  sender: Address
) {
  const market = await selectMarket(publicClient, registry);
  const oracle = await selectAddress("Enter the oracle address");
  const vault = await deployVaultWithChoices(
    walletClient,
    market,
    registry,
    oracle,
    sender
  );
  if (!vault) {
    logger.error("Vault deployment failed");
    return;
  }
  logger.info(`Vault deployed at ${vault} with oracle ${oracle}`);
}

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
  }
}

main()
  .catch(logger.error)
  .then(() => process.exit(0));
