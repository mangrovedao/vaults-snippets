import {
  createPublicClient,
  createWalletClient,
  formatUnits,
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
import { getCurrentVaultState } from "../vault/read";
import { FundsState } from "../vault/position";

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

async function viewVault(publicClient: PublicClient, registry: RegistryEntry) {
  const vault = await selectAddress("Enter the vault address");
  const data = await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );
  console.log(
    `Market : ${data.market.base.symbol}/${data.market.quote.symbol} (tickSpacing: ${data.market.tickSpacing})`
  );
  console.log("fees :");
  console.table({
    performanceFee: `${data.feeData.performanceFee * 100}%`,
    managementFee: `${data.feeData.managementFee * 100}%`,
  });
  if (data.position.params.pricePoints === 0) {
    console.log("no position set");
  } else {
    console.log("position :");
    console.table({
      tickIndex0: data.position.tickIndex0,
      tickOffset: data.position.tickOffset,
      fundsState:
        data.position.fundsState === FundsState.Active
          ? "active"
          : data.position.fundsState === FundsState.Passive
          ? "passive"
          : "vault",
      gasprice: data.position.params.gasprice,
      gasreq: data.position.params.gasreq,
      stepSize: data.position.params.stepSize,
      pricePoints: data.position.params.pricePoints,
    });
  }
  console.log("Balances :");
  console.table({
    kandel: {
      base: `${formatUnits(
        data.kandelBalance.base,
        data.market.base.decimals
      )} ${data.market.base.symbol}`,
      quote: `${formatUnits(
        data.kandelBalance.quote,
        data.market.quote.decimals
      )} ${data.market.quote.symbol}`,
    },
    vault: {
      base: `${formatUnits(
        data.vaultBalance.base,
        data.market.base.decimals
      )} ${data.market.base.symbol}`,
      quote: `${formatUnits(
        data.vaultBalance.quote,
        data.market.quote.decimals
      )} ${data.market.quote.symbol}`,
    },
  });
  console.log("Addresses :");
  console.table({
    oracle: data.oracle,
    owner: data.owner,
    kandel: data.kandel,
    feeRecipient: data.feeData.feeRecipient,
  });
  console.log(
    `Current price : ${data.currentPrice} (tick: ${data.currentTick})`
  );
  console.log(`position from kandel contract :`);
  console.table({
    ...data.kandelState,
    asks: data.kandelState.asks.length,
    bids: data.kandelState.bids.length,
  });
  console.table([...data.kandelState.asks, ...data.kandelState.bids]);
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
    case PossibleActions.VIEW_VAULT:
      await viewVault(publicClient, chain);
      break;
  }
}

main()
  .catch(logger.error)
  .then(() => process.exit(0));
