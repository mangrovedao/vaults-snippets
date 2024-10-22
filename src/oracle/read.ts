import { erc20Abi, type Address, type Client } from "viem";
import { multicall } from "viem/actions";
import { MangroveChainlinkOracleAbi } from "../../abis/MangroveChainlinkOracle";
import { priceFromTick, rawPriceToHumanPrice } from "@mangrovedao/mgv/lib";
import type { MarketParams } from "@mangrovedao/mgv";
import { buildToken } from "@mangrovedao/mgv/addresses";

type Result = {
  market: MarketParams;
  tick: bigint;
  price: number;
};

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
