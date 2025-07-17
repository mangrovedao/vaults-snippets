/**
 * Symphony Quote Module
 * 
 * This module provides functionality for obtaining price quotes from the Symphony aggregator.
 * It uses the official symphony-sdk to communicate with the Symphony API.
 */
import type { Address, Client } from "viem";
import { type Token as MangroveToken } from "@mangrovedao/mgv";

// Import Symphony SDK (with type assertion to bypass TypeScript issues)
// @ts-ignore
import { Symphony } from "symphony-sdk/viem";

/**
 * Symphony quote result interface
 */
export interface SymphonyQuoteResult {
    amountOut: bigint;
    route: any; // Symphony route object
    priceImpact: string;
    gasEstimate: bigint;
}

/**
 * Gets a raw quote from the Symphony SDK
 */
async function raw_getSymphonyQuote(
    sellToken: MangroveToken,
    buyToken: MangroveToken,
    amountIn: bigint
): Promise<any> {
    try {
        // Initialize Symphony aggregator instance
        const symphony = new Symphony();

        const route = await symphony.getRoute(
            sellToken.address.toString().toLowerCase(),
            buyToken.address.toString().toLowerCase(),
            amountIn.toString(),
            { isRaw: true }
        );

        console.log("route", route);
        if (!route) {
            throw new Error("No route found from Symphony");
        }

        return route;
    } catch (error) {
        console.error("Error getting Symphony quote:", error);
        throw new Error(`Failed to get Symphony quote: ${error}`);
    }
}

/**
 * Gets a quote from Symphony for swapping tokens
 * 
 * @param client - Viem client instance
 * @param vault - Vault address
 * @param sellToken - Token to sell (MangroveToken with address and decimals)
 * @param buyToken - Token to buy (MangroveToken with address and decimals)  
 * @param amountIn - Amount of tokens to sell
 * @param chainId - Chain ID for the transaction
 * @returns Promise<SymphonyQuoteResult> - Quote result with routing information
 */
export async function getSymphonyQuote(
    client: Client,
    vault: Address,
    sellToken: MangroveToken,
    buyToken: MangroveToken,
    amountIn: bigint,
    chainId: number
): Promise<SymphonyQuoteResult> {
    // Get route from Symphony SDK
    const route = await raw_getSymphonyQuote(sellToken, buyToken, amountIn);

    // Extract relevant information from the route
    console.log("getTotalAmountOut()", route.getTotalAmountOut());
    const amountOut = route.getTotalAmountOut().amountOut
    const gasEstimate = BigInt(route.getGasEstimate ? route.getGasEstimate() : "300000"); // Default gas estimate

    // Calculate price impact (simplified calculation)
    const priceImpact = "0.1";

    return {
        amountOut,
        route,
        priceImpact,
        gasEstimate
    };
} 