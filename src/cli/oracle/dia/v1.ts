/**
 * DIA V1 Oracle CLI Module
 * 
 * This module provides the command-line interface functionality for deploying and
 * interacting with DIA V1 oracles. The V1 version supports price feed configurations
 * with vault integrations for token pairs.
 * 
 * @module cli/oracle/dia/v1
 */
import type { Token } from "@mangrovedao/mgv";
import type { Address, Client } from "viem";
import { selectDiaFeeds } from "./utils";
import { requestForVaultFeed } from "../utils";
import { deployDiaV1Oracle } from "../../../oracle/dia/v1";

/**
 * Deploys a DIA V1 Oracle through an interactive CLI form
 * 
 * This function:
 * 1. Guides the user through selecting appropriate DIA feeds for the base and quote tokens
 * 2. Requests vault feed information for both base and quote tokens
 * 3. Deploys the oracle using the selected configuration
 * 
 * @param client - The blockchain client
 * @param base - The base token
 * @param quote - The quote token
 * @param oracleFactory - The address of the oracle factory contract
 * @param intermediaryDecimals - Decimal precision for intermediary calculations (default: 18)
 * @returns The address of the deployed oracle
 * @throws Error if the oracle deployment fails
 */
export async function deployDiaV1OracleForm(
  client: Client,
  base: Token,
  quote: Token,
  oracleFactory: Address,
  intermediaryDecimals: number = 18
) {
  const args = await selectDiaFeeds(base, quote, intermediaryDecimals);
  const baseVault = await requestForVaultFeed(client, "Choose a base vault");
  const quoteVault = await requestForVaultFeed(client, "Choose a quote vault");
  const oracle = await deployDiaV1Oracle(
    client,
    oracleFactory,
    {
      ...args,
      baseVault,
      quoteVault,
    }
  );
  if (!oracle) {
    throw new Error("Failed to deploy Oracle");
  }
  return oracle;
}
