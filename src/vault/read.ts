/**
 * Vault Read Operations Module
 *
 * This module provides functions for reading data from Mangrove Vaults,
 * including current state, balances, positions, and other information.
 *
 * @module vault/read
 */
import {
  kandelActions,
  type GetKandelStateResult,
  type MangroveActionsDefaultParams,
  type MarketParams,
} from "@mangrovedao/mgv";
import type { FeeData } from "./fee";
import type { PositionData } from "./position";
import type { Address, Client } from "viem";
import { multicall, readContract } from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { getPrice } from "../oracle/read";
import { FEE_PRECISION } from "../utils/constants";
import type { SavedVault } from "../cli/select";
import { ERC4626VaultAbi } from "../../abis/ERC4626VaultAbi";

/**
 * Represents token balances for base and quote tokens
 *
 * @property base - The base token balance
 * @property quote - The quote token balance
 */
type Balance = {
  base: bigint;
  quote: bigint;
};

/**
 * Comprehensive representation of a vault's current state
 *
 * @property feeData - Fee configuration data
 * @property position - Position data including parameters and state
 * @property kandelBalance - Token balances held by the kandel strategy
 * @property vaultBalance - Token balances held by the vault
 * @property market - Market parameters
 * @property oracle - Address of the price oracle
 * @property currentPrice - Current price from the oracle
 * @property currentTick - Current tick corresponding to the price
 * @property owner - Address of the vault owner
 * @property kandel - Address of the kandel strategy contract
 * @property kandelState - Detailed state of the kandel strategy
 */
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
  baseVault?: Address;
  quoteVault?: Address;
};

/**
 * Retrieves the current state of a Mangrove Vault
 *
 * Performs a multicall to efficiently fetch all relevant data from the vault and related contracts.
 *
 * @param client - The blockchain client
 * @param vault - The address of the vault
 * @param mangroveParams - Mangrove protocol parameters
 * @returns The current state of the vault
 */
export async function getCurrentVaultState(
  client: Client,
  vault: SavedVault,
  mangroveParams: MangroveActionsDefaultParams
): Promise<CurrentVaultState> {
  const currentVaultsPromise =
    vault.vaultType === "erc4626"
      ? readContract(client, {
          address: vault.address,
          abi: ERC4626VaultAbi,
          functionName: "currentVaults",
        }).then((r) => ({ baseVault: r[0], quoteVault: r[1] }))
      : Promise.resolve({ baseVault: undefined, quoteVault: undefined });

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
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "feeData",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "tickIndex0",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "kandelTickOffset",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "kandelParams",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "fundsState",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "getKandelBalances",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "getVaultBalances",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "market",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "oracle",
      },
      {
        address: vault.address,
        abi: MangroveVaultAbi,
        functionName: "owner",
      },
      {
        address: vault.address,
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

  const { baseVault, quoteVault } = await currentVaultsPromise;

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
    baseVault,
    quoteVault,
  };
}
