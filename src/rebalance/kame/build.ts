/**
 * Kame Swap Builder Module
 * 
 * This module provides functionality for building swap transactions using the Kame aggregator.
 * It uses the official @kame-ag/aggregator-sdk to build swap transactions.
 */
import type { Address, Hex } from "viem";
import { Api, FetchProviderConnector, type SwapResponse } from "@kame-ag/aggregator-sdk";
import { Token, Address as KameAddress } from "@kame-ag/sdk-core";

// Initialize Kame aggregator API instance
const kameAPI = new Api({
    httpConnector: new FetchProviderConnector()
});

/**
 * Kame SDK swap parameters
 */
type GetSwapParametersParams = {
    origin: KameAddress;
    fromToken: Token;
    amount: string;
    toToken: Token;
};

/**
 * Kame swap transaction result
 */
type KameSwapResult = {
    transaction: {
        to: Address;
        data: Hex;
        value: bigint;
    };
    rawResponse: SwapResponse;
};

/**
 * Builds a swap transaction using the Kame SDK
 */
async function raw_buildKameSwap(
    params: GetSwapParametersParams
): Promise<SwapResponse> {
    // Use the Kame SDK getSwap method based on the official documentation
    // Reference: https://docs.kame.ag/developer/aggregator-sdk/get-swap-quote
    const response = await kameAPI.getSwap(params);

    return response;
}

/**
 * Builds a Kame swap transaction for a vault
 */
export async function buildKameSwap(
    vault: Address,
    fromToken: Address,
    toToken: Address,
    amountOut: bigint,
    chainId: number
): Promise<KameSwapResult> {
    // Create Token instances for Kame SDK
    const fromTokenInstance = new Token(chainId, fromToken, 18); // Note: decimals should be fetched
    const toTokenInstance = new Token(chainId, toToken, 18); // Note: decimals should be fetched
    const originAddress = new KameAddress(vault);

    const params: GetSwapParametersParams = {
        origin: originAddress,
        fromToken: fromTokenInstance,
        amount: amountOut.toString(),
        toToken: toTokenInstance,
    };

    const response = await raw_buildKameSwap(params);

    return {
        transaction: {
            to: response.tx.to as Address,
            data: response.tx.data as Hex,
            value: BigInt(response.tx.value),
        },
        rawResponse: response,
    };
} 