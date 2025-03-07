/**
 * Chainlink V2 Oracle CLI Module
 * 
 * This module provides the command-line interface functionality for deploying and
 * interacting with Chainlink V2 oracles. The V2 version of Chainlink oracles supports
 * more complex configurations with multiple feeds and vault integrations.
 * 
 * @module cli/oracle/chainlink/v2
 */
import type { Address } from "viem";

import type { Token } from "@mangrovedao/mgv";
import type { Client } from "viem";
import { getFeeds } from "../../../oracle/chainlink/get-feeds";
import ora from "ora";
import { logger } from "../../../utils/logger";
import { chooseChainlinkFeeds } from "./chose-feed";
import { deployChainlinkV2Oracle } from "../../../oracle/chainlink/v2";
import { requestForVaultFeed } from "../utils";

/**
 * Deploys a Chainlink V2 Oracle through an interactive CLI form
 * 
 * This function:
 * 1. Fetches available Chainlink price feeds from the provided metadata link
 * 2. Guides the user through selecting appropriate feeds for the base and quote tokens
 * 3. Requests vault feed information
 * 4. Deploys the oracle using the selected configuration
 * 
 * @param client - The blockchain client
 * @param base - The base token
 * @param quote - The quote token
 * @param oracleFactory - The address of the oracle factory contract
 * @param chainlinkMetadataLink - URL to fetch Chainlink price feed metadata
 * @param intermediaryDecimals - Decimal precision for intermediary calculations (default: 18)
 * @returns The address of the deployed oracle, or false if deployment failed or was cancelled
 */
export async function deployChainlinkV2OracleForm(
  client: Client,
  base: Token,
  quote: Token,
  oracleFactory: Address,
  chainlinkMetadataLink: string,
  intermediaryDecimals: number = 18
) {
  const spinner = ora(
    `Getting feeds from ${chainlinkMetadataLink}`
  ).start();
  const feeds = await getFeeds(chainlinkMetadataLink);
  spinner.succeed(`Got ${feeds.length} feeds`);

  try {
    const args = await chooseChainlinkFeeds(
      feeds,
      base,
      quote,
      intermediaryDecimals
    );
    const baseVault = await requestForVaultFeed(client, "Choose a base vault");
    const quoteVault = await requestForVaultFeed(
      client,
      "Choose a quote vault"
    );
    const oracle = await deployChainlinkV2Oracle(
      client,
      oracleFactory,
      {
        ...args,
        baseVault,
        quoteVault,
      }
    );
    if (!oracle) {
      throw new Error("Oracle deployment failed");
    }
    return oracle;
  } catch (error) {
    logger.info("Oracle deployment cancelled");
    return false;
  }
}
