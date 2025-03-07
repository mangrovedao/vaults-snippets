/**
 * Odos Quote Module
 * 
 * This module provides functionality for obtaining price quotes from the Odos protocol.
 * It handles the communication with the Odos API to get swap quotes for token pairs.
 */
import { isAddressEqual, type Address, type Client } from "viem";

// Odos API endpoint for obtaining price quotes
const ODOS_QUOTE_ENDPOINT = "https://api.odos.xyz/sor/quote/v2";

/**
 * Request parameters for the Odos quote API
 * 
 * @property chainId - The ID of the blockchain network
 * @property compact - Whether to return a compact response
 * @property gasPrice - Optional gas price override in gwei
 * @property inputTokens - Array of tokens and amounts to swap from
 * @property outputTokens - Array of tokens and proportions to swap to
 * @property referralCode - Referral code for the Odos platform
 * @property slippageLimitPercent - Maximum acceptable slippage percentage
 * @property sourceBlacklist - Array of sources to exclude from routing
 * @property sourceWhitelist - Array of sources to include in routing
 * @property userAddr - The address of the user/vault executing the swap
 */
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

/**
 * Response structure from the Odos quote API
 * 
 * Contains all necessary information about the potential swap,
 * including token amounts, gas estimates, and path information.
 */
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

/**
 * Makes a raw request to the Odos quote API
 * 
 * This function:
 * 1. Sends the quote request to the Odos API
 * 2. Validates the HTTP response
 * 3. Parses and returns the JSON response
 * 
 * @param request - The formatted quote request parameters
 * @returns Promise that resolves to the quote response
 * @throws Error if the API request fails
 */
async function raw_getOdosQuote(
  url: string,
  request: MinimalOdosQuoteRequest
): Promise<OdosQuoteResponse> {
  const response = await fetch(url, {
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

/**
 * Gets a swap quote from the Odos protocol
 * 
 * This function:
 * 1. Constructs a quote request with the provided parameters
 * 2. Sends the request to the Odos API
 * 3. Validates the response to ensure it matches the requested tokens
 * 4. Returns a simplified quote object with relevant swap details
 * 
 * @param client - The blockchain client
 * @param vault - The address of the vault executing the swap
 * @param fromToken - The address of the token to swap from
 * @param toToken - The address of the token to swap to
 * @param amountOut - The amount of fromToken to swap
 * @param slippageLimitPercent - Maximum acceptable slippage percentage (default: 0.3%)
 * @param gasPrice - Optional gas price override in gwei
 * @returns Promise that resolves to a simplified quote object
 * @throws Error if the client is not connected to a chain or if the response is invalid
 */
export async function getOdosQuote(
  client: Client,
  vault: Address,
  fromToken: Address,
  toToken: Address,
  amountOut: bigint,
  slippageLimitPercent: number = 0.3,
  url: string = ODOS_QUOTE_ENDPOINT,
  gasPrice?: number
) {
  if (!client.chain) {
    throw new Error("Client is not connected to a chain");
  }

  // Construct the quote request
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

  // Add gas price if provided
  if (gasPrice) {
    request.gasPrice = gasPrice;
  }

  // Get the quote from Odos
  const response = await raw_getOdosQuote(url, request);

  // Validate the response
  if (
    response.inTokens.length !== 1 ||
    response.outTokens.length !== 1 ||
    !isAddressEqual(response.inTokens[0], fromToken) ||
    !isAddressEqual(response.outTokens[0], toToken)
  ) {
    throw new Error("Invalid quote response");
  }

  // Return a simplified quote object with relevant details
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
