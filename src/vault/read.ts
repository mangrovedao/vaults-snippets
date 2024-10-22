import {
  kandelActions,
  type GetKandelStateResult,
  type MangroveActionsDefaultParams,
  type MarketParams,
} from "@mangrovedao/mgv";
import type { FeeData } from "./fee";
import type { PositionData } from "./position";
import type { Address, Client } from "viem";
import { multicall } from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { getPrice } from "../oracle/read";
import { FEE_PRECISION } from "../utils/constants";

type Balance = {
  base: bigint;
  quote: bigint;
};

export type CurrentVaultState = {
  feeData: FeeData;
  position: PositionData;
  kandelBalance: Balance;
  vaultBalance: Balance;
  market: MarketParams;
  oracle: Address;
  currentPrice: number;
  currentTick: bigint;
  owner: Address;
  kandel: Address;
  kandelState: GetKandelStateResult;
};

export async function getCurrentVaultState(
  client: Client,
  vault: Address,
  mangroveParams: MangroveActionsDefaultParams
): Promise<CurrentVaultState> {
  const [
    [performanceFee, managementFee, feeRecipient],
    tickIndex0,
    tickOffset,
    params,
    fundsState,
    [kandelBalanceBase, kandelBalanceQuote],
    [vaultBalanceBase, vaultBalanceQuote],
    [baseTokenAddress, quoteTokenAddress, tickSpacing],
    oracle,
    owner,
    kandel,
  ] = await multicall(client, {
    contracts: [
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "feeData",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "tickIndex0",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "kandelTickOffset",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "kandelParams",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "fundsState",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "getKandelBalances",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "getVaultBalances",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "market",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "oracle",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "owner",
      },
      {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "kandel",
      },
    ],
    allowFailure: false,
  });

  const { price, tick, market } = await getPrice(
    client,
    oracle,
    baseTokenAddress,
    quoteTokenAddress,
    tickSpacing
  );

  const kandelState = await client
    .extend(kandelActions(mangroveParams, market, kandel))
    .getKandelState();

  return {
    feeData: {
      performanceFee: performanceFee / FEE_PRECISION,
      managementFee: managementFee / FEE_PRECISION,
      feeRecipient,
    },
    position: {
      tickIndex0: BigInt(tickIndex0),
      tickOffset,
      params,
      fundsState,
    },
    kandelBalance: {
      base: kandelBalanceBase,
      quote: kandelBalanceQuote,
    },
    vaultBalance: {
      base: vaultBalanceBase,
      quote: vaultBalanceQuote,
    },
    market,
    oracle,
    currentPrice: price,
    currentTick: tick,
    owner,
    kandel,
    kandelState,
  };
}
