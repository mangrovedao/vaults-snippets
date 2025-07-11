/**
 * OpenOcean Build Module
 * 
 * This module provides functionality for building swap transactions using the OpenOcean aggregator.
 * It constructs the necessary transaction data for executing swaps through OpenOcean routes.
 */
import type { Address, Client } from "viem";
import { type Token as MangroveToken } from "@mangrovedao/mgv";
import type { OpenOceanQuoteResult } from "./quote";

/**
 * OpenOcean swap parameters interface
 */
export interface OpenOceanSwapParams {
    route: any; // OpenOcean route object
    sellToken: MangroveToken;
    buyToken: MangroveToken;
    amountInMax: bigint;
    amountOutMin: bigint;
    sell: boolean;
    gas: bigint;
}

/**
 * OpenOcean transaction result interface
 */
export interface OpenOceanSwapResult {
    to: Address;
    data: `0x${string}`;
    value: bigint;
    gasLimit: bigint;
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
 * Builds an OpenOcean swap transaction
 * 
 * @param client - Viem client instance
 * @param vault - Vault address
 * @param params - OpenOcean swap parameters
 * @returns Promise<OpenOceanSwapResult> - Transaction data for the swap
 */
export async function buildOpenOceanSwap(
    client: Client,
    vault: Address,
    params: OpenOceanSwapParams,
    chainId: number
): Promise<OpenOceanSwapResult> {
    try {
        const chainString = CHAIN_ID_MAP[chainId];
        if (!chainString) {
            throw new Error(`Unsupported chain ID: ${chainId}`);
        }

        // OpenOcean swap API parameters
        const swapParams = new URLSearchParams({
            inTokenAddress: params.sellToken.address.toString(),
            outTokenAddress: params.buyToken.address.toString(),
            amount: params.amountInMax.toString(),
            slippage: "1", // 1% slippage
            account: vault, // The vault address that will execute the swap
            gasPrice: "5", // Default gas price in gwei
            referrer: "0x0000000000000000000000000000000000000000", // No referrer
        });

        const url = `https://open-api.openocean.finance/v3/${chainString}/swap_quote?${swapParams}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`OpenOcean swap API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.code !== 200) {
            throw new Error(`OpenOcean swap failed: ${data.error || 'Unknown error'}`);
        }

        const swapData = data.data;

        // Extract transaction details
        const to = swapData.to as Address;
        const calldata = swapData.data as `0x${string}`;
        const value = BigInt(swapData.value || "0");

        return {
            to,
            data: calldata,
            value,
            gasLimit: params.gas
        };

    } catch (error) {
        console.error("Error building OpenOcean swap:", error);
        throw new Error(`Failed to build OpenOcean swap: ${error}`);
    }
} 