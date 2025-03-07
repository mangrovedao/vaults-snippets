/**
 * Odos Swap Builder Module
 * 
 * This module provides functionality for building swap transactions using the Odos protocol.
 * It handles the assembly of swap paths and transaction data generation through the Odos API.
 */
import type { Address, Hex } from "viem";

// Odos API endpoint for assembling swap transactions
const ASSEMBLE_ENDPOINT = "https://api.odos.xyz/sor/assemble";

/**
 * Request parameters for the Odos assemble API
 * 
 * @property pathId - The unique identifier for the swap path
 * @property simulate - Whether to simulate the transaction
 * @property userAddr - The address of the user/vault executing the swap
 */
type AssembleRequest = {
  pathId: string;
  simulate: boolean;
  userAddr: Address;
};

/**
 * Response structure from the Odos assemble API
 * 
 * Contains all necessary information about the assembled swap transaction,
 * including gas estimates, token amounts, and the transaction data.
 */
type OdosAssembleResponse = {
  deprecated: null;
  blockNumber: number;
  gasEstimate: number;
  gasEstimateValue: number;
  inputTokens: {
    tokenAddress: Address;
    amount: string;
  }[];
  outputTokens: {
    tokenAddress: Address;
    amount: string;
  }[];
  netOutValue: number;
  outValues: string[];
  transaction: {
    gas: number;
    gasPrice: bigint;
    value: string;
    to: Address;
    from: Address;
    data: Hex;
    nonce: number;
    chainId: number;
  };
  simulation: null;
};

/**
 * Assembles a swap transaction using the Odos API
 * 
 * This function:
 * 1. Constructs the request with the provided path ID and user address
 * 2. Sends the request to the Odos assemble endpoint
 * 3. Validates the response and returns the assembled transaction data
 * 
 * @param pathId - The unique identifier for the swap path
 * @param userAddr - The address of the user/vault executing the swap
 * @param simulate - Whether to simulate the transaction (default: false)
 * @returns Promise that resolves to the assembled swap transaction data
 * @throws Error if the API request fails
 */
async function assembleOdosSwap(
  pathId: string,
  userAddr: Address,
  simulate: boolean = false,
  url: string = ASSEMBLE_ENDPOINT
): Promise<OdosAssembleResponse> {
  const request: AssembleRequest = {
    pathId,
    simulate,
    userAddr,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Builds an Odos swap transaction for a vault
 * 
 * This function serves as the main entry point for creating Odos swap transactions.
 * It calls the assembleOdosSwap function with the vault address as the user address.
 * 
 * @param vault - The address of the vault that will execute the swap
 * @param pathId - The unique identifier for the swap path
 * @returns Promise that resolves to the assembled swap transaction data
 */
export async function buildOdosSwap(
  vault: Address,
  pathId: string
) {
  const response = await assembleOdosSwap(pathId, vault);
  return response;
}
