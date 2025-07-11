/**
 * Symphony Build Module
 * 
 * This module provides functionality for building swap transactions using the Symphony aggregator.
 * It constructs the necessary transaction data for executing swaps through Symphony routes.
 */
import type { Address, Client } from "viem";
import { type Token as MangroveToken } from "@mangrovedao/mgv";
import type { SymphonyQuoteResult } from "./quote";

// Import Symphony SDK (with type assertion to bypass TypeScript issues)
// @ts-ignore
import { Symphony } from "symphony-sdk/viem";

/**
 * Symphony swap parameters interface
 */
export interface SymphonySwapParams {
    route: any; // Symphony route object
    sellToken: MangroveToken;
    buyToken: MangroveToken;
    amountInMax: bigint;
    amountOutMin: bigint;
    sell: boolean;
    gas: bigint;
}

/**
 * Symphony transaction result interface
 */
export interface SymphonySwapResult {
    to: Address;
    data: `0x${string}`;
    value: bigint;
    gasLimit: bigint;
}

/**
 * Builds a Symphony swap transaction
 * 
 * @param client - Viem client instance
 * @param vault - Vault address
 * @param params - Symphony swap parameters
 * @returns Promise<SymphonySwapResult> - Transaction data for the swap
 */
export async function buildSymphonySwap(
    client: Client,
    vault: Address,
    params: SymphonySwapParams
): Promise<SymphonySwapResult> {
    try {
        const symphony = new Symphony();

        // Generate the transaction calldata using Symphony SDK
        const swapData = await params.route.generateCalldata({
            from: vault,
            route: params.route,
            includesNative: params.sellToken.address.toString().toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            slippage: {
                slippageAmount: "50", // 0.5% default slippage
                isRaw: false,
                isBps: true,
                outTokenDecimals: params.buyToken.decimals
            }
        });

        // Extract transaction details
        const to = swapData.to as Address;
        const data = swapData.data as `0x${string}`;
        const value = BigInt(swapData.value || "0");

        return {
            to,
            data,
            value,
            gasLimit: params.gas
        };

    } catch (error) {
        console.error("Error building Symphony swap:", error);
        throw new Error(`Failed to build Symphony swap: ${error}`);
    }
} 