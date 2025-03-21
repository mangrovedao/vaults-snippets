import type { Address, Client } from "viem";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { simulateContract } from "viem/actions";
import type { MarketParams } from "@mangrovedao/mgv";
import { logger } from "../utils/logger";
import { formatUnits } from "viem";

export async function burn(
  client: Client,
  vault: Address,
  shares: bigint,
  minBaseOut = 0n,
  minQuoteOut = 0n,
  market?: MarketParams
) {
  const {
    request,
    result: [baseAmount, quoteAmount],
  } = await simulateContract(client, {
    address: vault,
    abi: MangroveVaultAbi,
    functionName: "burn",
    args: [shares, minBaseOut, minQuoteOut],
    account: client.account,
    gas: 20_000_000n,
  });

  const baseFormatted = market
    ? `${formatUnits(baseAmount, market.base.decimals)} ${market.base.symbol}`
    : baseAmount.toString();
  const quoteFormatted = market
    ? `${formatUnits(quoteAmount, market.quote.decimals)} ${
        market.quote.symbol
      }`
    : quoteAmount.toString();

  const receipt = await logger.handleRequest(request, client, {
    header: `burning ${shares} shares for ${baseFormatted} and ${quoteFormatted}`,
    success: (block, hash) =>
      `burned ${shares} shares for ${baseFormatted} and ${quoteFormatted} in block ${block}: ${hash}`,
    failure: (hash) =>
      `burning ${shares} shares for ${baseFormatted} and ${quoteFormatted} failed: ${hash}`,
    label: "Burning",
  });
  return receipt.status === "success";
}
