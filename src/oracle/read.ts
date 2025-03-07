/**
 * Oracle Read Operations Module
 * 
 * This module provides functions for reading price data from oracles,
 * including current price, tick, and market information.
 * 
 * @module oracle/read
 */
import { erc20Abi, type Address, type Client } from "viem";
import { multicall } from "viem/actions";
import { MangroveChainlinkOracleAbi } from "../../abis/MangroveChainlinkOracle";
import { priceFromTick, rawPriceToHumanPrice } from "@mangrovedao/mgv/lib";
import type { MarketParams } from "@mangrovedao/mgv";
import { buildToken } from "@mangrovedao/mgv/addresses";

/**
 * Result of a price query from an oracle
 * 
 * @property market - The market parameters
 * @property tick - The current tick value
 * @property price - The human-readable price
 */
type Result = {
  market: MarketParams;
  tick: bigint;
  price: number;
};

/**
 * Retrieves the current price from an oracle
 * 
 * This function:
 * 1. Fetches token details (decimals, symbols) for base and quote tokens
 * 2. Retrieves the current tick from the oracle
 * 3. Builds the market parameters
 * 4. Converts the tick to a human-readable price
 * 
 * @param client - The blockchain client
 * @param oracle - The address of the oracle contract
 * @param baseAddress - The address of the base token
 * @param quoteAddress - The address of the quote token
 * @param tickSpacing - The tick spacing for the market (default: 1)
 * @returns Object containing market parameters, tick, and price
 */
export async function getPrice(
  client: Client,
  oracle: Address,
  baseAddress: Address,
  quoteAddress: Address,
  tickSpacing: bigint = 1n
): Promise<Result> {
  const [baseDecimals, baseSymbol, quoteDecimals, quoteSymbol, tick] =
    await multicall(client, {
      contracts: [
        {
          address: baseAddress,
          abi: erc20Abi,
          functionName: "decimals",
        },
        {
          address: baseAddress,
          abi: erc20Abi,
          functionName: "symbol",
        },
        {
          address: quoteAddress,
          abi: erc20Abi,
          functionName: "decimals",
        },
        {
          address: quoteAddress,
          abi: erc20Abi,
          functionName: "symbol",
        },
        {
          address: oracle,
          abi: MangroveChainlinkOracleAbi,
          functionName: "tick",
        },
      ],
      allowFailure: false,
    });

  const base = buildToken({
    address: baseAddress,
    decimals: Number(baseDecimals),
    symbol: baseSymbol,
  });

  const quote = buildToken({
    address: quoteAddress,
    decimals: Number(quoteDecimals),
    symbol: quoteSymbol,
  });

  const market: MarketParams = {
    base,
    quote,
    tickSpacing,
  };

  const price = rawPriceToHumanPrice(priceFromTick(tick), market);

  return {
    market,
    tick,
    price,
  };
}
