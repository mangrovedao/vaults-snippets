import { isAddressEqual, type Address, type Client } from "viem";
import { getGasPrice } from "viem/actions";

const ODOS_QUOTE_ENDPOINT = "https://api.odos.xyz/sor/quote/v2";

type MinimalOdosQuoteRequest = {
  chainId: number;
  compact: boolean;
  gasPrice?: number | undefined;
  inputTokens: {
    amount: string;
    tokenAddress: Address;
  }[];
  outputTokens: {
    proportion: number;
    tokenAddress: Address;
  }[];
  referralCode: number;
  slippageLimitPercent: number;
  sourceBlacklist: string[];
  sourceWhitelist: string[];
  userAddr: Address;
};

type OdosQuoteResponse = {
  inTokens: Address[];
  outTokens: Address[];
  inAmounts: string[];
  outAmounts: string[];
  gasEstimate: number;
  dataGasEstimate: number;
  gweiPerGas: number;
  gasEstimateValue: number;
  inValues: number[];
  outValues: number[];
  netOutValue: number;
  priceImpact: number;
  percentDiff: number;
  partnerFeePercent: number;
  pathId: string;
  pathViz: null;
  blockNumber: number;
};

async function raw_getOdosQuote(
  request: MinimalOdosQuoteRequest
): Promise<OdosQuoteResponse> {
  const response = await fetch(ODOS_QUOTE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok || response.status !== 200) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export async function getOdosQuote(
  client: Client,
  vault: Address,
  fromToken: Address,
  toToken: Address,
  amountOut: bigint,
  slippageLimitPercent: number = 0.3,
  gasPrice?: number
) {
  if (!client.chain) {
    throw new Error("Client is not connected to a chain");
  }

  const request: MinimalOdosQuoteRequest = {
    chainId: client.chain!.id,
    compact: true,
    inputTokens: [
      {
        amount: amountOut.toString(),
        tokenAddress: fromToken,
      },
    ],
    outputTokens: [
      {
        proportion: 1,
        tokenAddress: toToken,
      },
    ],
    referralCode: 0,
    slippageLimitPercent,
    sourceBlacklist: [],
    sourceWhitelist: [],
    userAddr: vault,
  };

  if (gasPrice) {
    request.gasPrice = gasPrice;
  }

  const response = await raw_getOdosQuote(request);

  if (
    response.inTokens.length !== 1 ||
    response.outTokens.length !== 1 ||
    !isAddressEqual(response.inTokens[0], fromToken) ||
    !isAddressEqual(response.outTokens[0], toToken)
  ) {
    throw new Error("Invalid quote response");
  }

  return {
    amountOut: BigInt(response.inAmounts[0]),
    amountIn: BigInt(response.outAmounts[0]),
    gasEstimate: response.gasEstimate,
    dataGasEstimate: response.dataGasEstimate,
    gweiPerGas: response.gweiPerGas,
    gasEstimateValue: response.gasEstimateValue,
    netOutValue: response.netOutValue,
    priceImpact: response.priceImpact,
    percentDiff: response.percentDiff,
    partnerFeePercent: response.partnerFeePercent,
    pathId: response.pathId,
    blockNumber: response.blockNumber,
  };
}
