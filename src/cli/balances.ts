/**
 * Token Balance Utility Module
 * 
 * This module provides functions for retrieving token balances from the blockchain.
 * It supports fetching balances for both individual tokens and trading pairs (markets).
 */
import type { MarketParams } from "@mangrovedao/mgv";
import { erc20Abi, type Address, type Client } from "viem";
import { multicall, readContract } from "viem/actions";

/**
 * Retrieves the balance of both base and quote tokens for a given market
 * 
 * This function uses multicall to efficiently fetch both token balances in a single request,
 * reducing network overhead and improving performance.
 * 
 * @param client - The blockchain client used to interact with the network
 * @param account - The address of the account to check balances for
 * @param market - The market parameters containing base and quote token information
 * @returns An object containing the base and quote token balances as BigInts
 */
export async function getBalancesForMarket(
  client: Client,
  account: Address,
  market: MarketParams
) {
  // Use multicall to batch both balance requests into a single network call
  const [base, quote] = await multicall(client, {
    contracts: [
      {
        address: market.base.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      },
      {
        address: market.quote.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      },
    ],
    allowFailure: false, // Ensure both calls succeed or the entire operation fails
  });
  
  return {
    base,
    quote,
  };
}

/**
 * Retrieves the balance of a specific token for a given account
 * 
 * @param client - The blockchain client used to interact with the network
 * @param account - The address of the account to check balance for
 * @param token - The address of the ERC20 token
 * @returns The token balance as a BigInt
 */
export async function getBalanceForToken(
  client: Client,
  account: Address,
  token: Address
) {
  const balance = await readContract(client, {
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
  });
  return balance;
}
