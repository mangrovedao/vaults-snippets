/**
 * Chainlink V1 Oracle CLI Module
 * 
 * This module provides the command-line interface functionality for deploying and
 * interacting with Chainlink V1 oracles. The V1 version supports basic price feed
 * configurations for token pairs.
 * 
 * @module cli/oracle/chainlink/v1
 */
import type { Hex } from "viem";

import type { Token } from "@mangrovedao/mgv";
import { type Address, type Client } from "viem";
import { chooseChainlinkFeeds } from "./chose-feed";
import inquirer from "inquirer";
import { logger } from "../../../utils/logger";
import { randomBytes } from "crypto";
import { deployChainlinkV1Oracle } from "../../../oracle/chainlink/v1";
import ora from "ora";

/**
 * Deploys a Chainlink V1 Oracle through an interactive CLI form
 * 
 * This function:
 * 1. Fetches available Chainlink price feeds from the provided metadata link
 * 2. Guides the user through selecting appropriate feeds for the base and quote tokens
 * 3. Deploys the oracle using the selected configuration
 * 4. Handles deployment failures with retry options
 * 
 * @param client - The blockchain client
 * @param base - The base token
 * @param quote - The quote token
 * @param oracleFactory - The address of the oracle factory contract
 * @param sender - The address of the transaction sender
 * @param chainlinkMetadataLink - URL to fetch Chainlink price feed metadata
 * @param intermediaryDecimals - Decimal precision for intermediary calculations (default: 18)
 * @returns The address of the deployed oracle, or false if deployment failed or was cancelled
 */
export async function deployChainlinkV1OracleForm(
  client: Client,
  base: Token,
  quote: Token,
  oracleFactory: Address,
  sender: Address,
  intermediaryDecimals: number = 18
): Promise<Address | false> {
  try {
    const args = await chooseChainlinkFeeds(base, quote, intermediaryDecimals);
    const oracle = await deployChainlinkV1Oracle(
      client,
      oracleFactory,
      args,
      false
    );
    if (!oracle) {
      throw new Error("Oracle deployment failed");
    }
    return oracle;
  } catch (error) {
    logger.info(`Oracle deployment failed`);
    const { test } = (await inquirer.prompt([
      {
        type: "confirm",
        name: "test",
        message:
          "An oracle has probably been deployed with the same arguments. Do you want to try to deploy another one?",
        default: false,
      },
    ])) as { test: boolean };
    if (test) {
      const args = await chooseChainlinkFeeds(base, quote, intermediaryDecimals);
      for (let i = 0; i < 10; i++) {
        logger.info(`Retrying...`);
        try {
          const _oracle = await deployChainlinkV1Oracle(
            client,
            oracleFactory,
            { ...args, salt: ("0x" + randomBytes(32).toString("hex")) as Hex },
            false
          );
          if (_oracle) {
            return _oracle;
          }
        } catch (error) {
          logger.info(`Retrying...`);
        }
      }
    }
    return false;
  }
}
