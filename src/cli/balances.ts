import type { MarketParams } from "@mangrovedao/mgv";
import { erc20Abi, type Address, type Client } from "viem";
import { multicall } from "viem/actions";

export async function getBalancesForMarket(
  client: Client,
  account: Address,
  market: MarketParams
) {
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
    allowFailure: false,
  });
  return {
    base,
    quote,
  };
}
