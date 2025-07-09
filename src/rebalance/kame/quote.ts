/**
 * Kame Quote Module
 * 
 * This module provides functionality for obtaining price quotes from the Kame aggregator.
 * It uses the official @kame-ag/aggregator-sdk to communicate with the Kame API.
 */
import type { Address, Client } from "viem";
import { Api, FetchProviderConnector, type QuoteResponse } from "@kame-ag/aggregator-sdk";
import { Token } from "@kame-ag/sdk-core";
import { type Token as MangroveToken } from "@mangrovedao/mgv";


// Initialize Kame aggregator API instance
const kameAPI = new Api({
    httpConnector: new FetchProviderConnector()
});

/**
 * Kame SDK quote parameters
 */
type GetQuoteParametersParams = {
    fromToken: Token;
    amount: string;
    toToken: Token;
};

/**
 * Gets a raw quote from the Kame SDK
 */
async function raw_getKameQuote(
    params: GetQuoteParametersParams
): Promise<QuoteResponse> {
    // Use the Kame SDK to get a quote based on the official documentation
    // Reference: https://docs.kame.ag/developer/aggregator-sdk/get-quote
    const response = await kameAPI.getQuote(params);

    return response;
}

/**
 * Kame quote result interface to match expected structure
 */
export interface KameQuoteResult {
    amountIn: bigint;
    amountOut: bigint;
    srcToken: string;
    dstToken: string;
    paths?: Array<any[]>;
}

/**
 * Gets a quote from the Kame aggregator for a token swap
 * 
 * @param client - The blockchain client
 * @param vault - The address of the vault making the swap
 * @param sellToken - The address of the token being sold
 * @param buyToken - The address of the token being bought
 * @param amountOut - The amount of sellToken to sell
 * @param chainId - The blockchain network ID
 * @returns Promise that resolves to a KameQuoteResult
 */
export async function getKameQuote(
    client: Client,
    vault: Address,
    sellToken: MangroveToken,
    buyToken: MangroveToken,
    amountOut: bigint,
    chainId: number
): Promise<KameQuoteResult> {
    // Create Token instances for Kame SDK
    const fromToken = new Token(chainId, sellToken.address.toString(), sellToken.decimals);
    const toToken = new Token(chainId, buyToken.address.toString(), buyToken.decimals);

    const params: GetQuoteParametersParams = {
        fromToken,
        amount: amountOut.toString(),
        toToken,
    };

    const response = await raw_getKameQuote(params);

    return {
        amountIn: BigInt(response.dstAmount),
        amountOut: BigInt(response.srcAmount),
        srcToken: response.srcToken,
        dstToken: response.dstToken,
        paths: response.paths,
    };
}

