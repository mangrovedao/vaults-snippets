import { getCurrentVaultState } from "../../vault/read";
import { FundsState } from "../../vault/position";
import type { PublicClient } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectAddress, selectVault } from "../select";
import { formatUnits } from "viem";
import { logger } from "../../utils/logger";
import chalk from "chalk";

export async function viewVault(
  publicClient: PublicClient,
  registry: RegistryEntry
) {
  const vault = await selectVault(publicClient, registry.chain.id);
  const data = await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );
  console.log(
    `Market : ${data.market.base.symbol}/${data.market.quote.symbol} (tickSpacing: ${data.market.tickSpacing})`
  );
  logger.logFees(data.feeData);
  logger.logPosition(data.position, data.market);
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
  console.log(chalk.bold("position from kandel contract :"));
  console.table({
    ...data.kandelState,
    asks: data.kandelState.asks.length,
    bids: data.kandelState.bids.length,
  });
  if (data.kandelState.asks.length > 0 || data.kandelState.bids.length > 0) {
    console.table([...data.kandelState.asks, ...data.kandelState.bids]);
  }
}
