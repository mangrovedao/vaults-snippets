import { getCurrentVaultState } from "../../vault/read";
import { FundsState } from "../../vault/position";
import type { PublicClient } from "viem";
import type { RegistryEntry } from "../../registry";
import { selectAddress } from "../select";
import { formatUnits } from "viem";

export async function viewVault(
  publicClient: PublicClient,
  registry: RegistryEntry
) {
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
