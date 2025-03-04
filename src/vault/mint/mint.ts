import { formatUnits, type Address, type Client } from "viem";
import { simulateContract } from "viem/actions";
import { MintHelperV1Abi } from "../../../abis/MintHelperV1ABI";
import type { MarketParams } from "@mangrovedao/mgv";
import { logger } from "../../utils/logger";
import { giveAllowanceIfNeeded } from "./allowance";

export async function mint(
  client: Client,
  account: Address,
  mintHelper: Address,
  vault: Address,
  maxBaseAmount: bigint,
  maxQuoteAmount: bigint,
  minShares = 0n,
  market: MarketParams,
  vaultDecimals?: number
) {
  const success = await giveAllowanceIfNeeded(client, account, [
    {
      token: market.base.address,
      spender: mintHelper,
      amount: maxBaseAmount,
      tokenSymbol: market.base.symbol,
      tokenDecimals: market.base.decimals,
    },
    {
      token: market.quote.address,
      spender: mintHelper,
      amount: maxQuoteAmount,
      tokenSymbol: market.quote.symbol,
      tokenDecimals: market.quote.decimals,
    },
  ]);
  if (!success) {
    return false;
  }
  const {
    request,
    result: [share, baseAmount, quoteAmount],
  } = await simulateContract(client, {
    address: mintHelper,
    abi: MintHelperV1Abi,
    functionName: "mint",
    args: [vault, maxBaseAmount, maxQuoteAmount, minShares],
    account: client.account,
  });

  const baseAmountFormatted = market
    ? `${formatUnits(baseAmount, market.base.decimals)} ${market.base.symbol}`
    : baseAmount.toString();
  const quoteAmountFormatted = market
    ? `${formatUnits(quoteAmount, market.quote.decimals)} ${
        market.quote.symbol
      }`
    : quoteAmount.toString();
  const shareFormatted = vaultDecimals
    ? `${formatUnits(share, vaultDecimals)} Vault shares`
    : `${share} Vault shares`;

  const receipt = await logger.handleRequest(request, client, {
    header: `minting ${shareFormatted} of ${baseAmountFormatted} and ${quoteAmountFormatted}`,
    success: (block, hash) =>
      `minted ${shareFormatted} of ${baseAmountFormatted} and ${quoteAmountFormatted} in block ${block}: ${hash}`,
    failure: (hash) =>
      `minting ${shareFormatted} of ${baseAmountFormatted} and ${quoteAmountFormatted} failed: ${hash}`,
    label: "Minting",
  });
  return receipt.status === "success";
}
