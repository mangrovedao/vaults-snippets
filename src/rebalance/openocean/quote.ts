/**
 * OpenOcean Quote Module
 * 
 * This module provides functionality for obtaining price quotes from the OpenOcean aggregator.
 * It uses the OpenOcean API to communicate with their aggregation services.
 */
import type { Address, Client } from "viem";
import { type Token as MangroveToken } from "@mangrovedao/mgv";

/**
 * OpenOcean quote result interface
 */
export interface OpenOceanQuoteResult {
    amountOut: bigint;
    route: any; // OpenOcean route object
    priceImpact: string;
    gasEstimate: bigint;
}

/**
 * Chain ID mapping for OpenOcean API
 */
const CHAIN_ID_MAP: Record<number, string> = {
    1: "1",        // Ethereum
    56: "56",      // BSC
    137: "137",    // Polygon
    42161: "42161", // Arbitrum
    8453: "8453",  // Base
    1329: "1329",  // Sei
};

/**
 * Gets a raw quote from the OpenOcean API
 */
async function raw_getOpenOceanQuote(
    sellToken: MangroveToken,
    buyToken: MangroveToken,
    amountIn: string,
    chainId: number
): Promise<any> {
    try {
        const chainString = CHAIN_ID_MAP[chainId];
        if (!chainString) {
            throw new Error(`Unsupported chain ID: ${chainId}`);
        }

        // OpenOcean API parameters
        const params = new URLSearchParams({
            inTokenAddress: sellToken.address.toString(),
            outTokenAddress: buyToken.address.toString(),
            amount: amountIn.toString(),
            gasPrice: "5", // Default gas price in gwei
            slippage: "1", // 1% slippage
        });

        const url = `https://open-api.openocean.finance/v3/${chainString}/quote?${params}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`OpenOcean API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.code !== 200) {
            throw new Error(`OpenOcean quote failed: ${data.error || 'Unknown error'}`);
        }

        return data.data;
    } catch (error) {
        console.error("Error getting OpenOcean quote:", error);
        throw new Error(`Failed to get OpenOcean quote: ${error}`);
    }
}

/**
 * Gets a quote from OpenOcean for swapping tokens
 * 
 * @param client - Viem client instance
 * @param vault - Vault address
 * @param sellToken - Token to sell (MangroveToken with address and decimals)
 * @param buyToken - Token to buy (MangroveToken with address and decimals)  
 * @param amountIn - Amount of tokens to sell
 * @param chainId - Chain ID for the transaction
 * @returns Promise<OpenOceanQuoteResult> - Quote result with routing information
 */
export async function getOpenOceanQuote(
    client: Client,
    vault: Address,
    sellToken: MangroveToken,
    buyToken: MangroveToken,
    amountIn: string,
    chainId: number
): Promise<OpenOceanQuoteResult> {
    try {
        // Get route from OpenOcean API
        const quoteData = await raw_getOpenOceanQuote(sellToken, buyToken, amountIn, chainId);

        // Extract relevant information from the quote
        const amountOut = BigInt(quoteData.outAmount);
        const gasEstimate = BigInt(quoteData.estimatedGas || "300000"); // Default gas estimate

        // Calculate price impact from quote data
        const priceImpact = quoteData.priceImpact || "0.1";

        return {
            amountOut,
            route: quoteData,
            priceImpact,
            gasEstimate
        };

    } catch (error) {
        console.error("Error in getOpenOceanQuote:", error);
        throw new Error(`Failed to get OpenOcean quote: ${error}`);
    }
} 