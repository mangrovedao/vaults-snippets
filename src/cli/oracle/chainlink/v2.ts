import type { Address } from "viem";

import type { Token } from "@mangrovedao/mgv";
import type { Client } from "viem";
import type { RegistryEntry } from "../../../registry";
import { getFeeds } from "../../../oracle/chainlink/get-feeds";
import ora from "ora";
import { logger } from "../../../utils/logger";
import { chooseChainlinkFeeds } from "./chose-feed";
import { deployChainlinkV2Oracle } from "../../../oracle/chainlink/v2";
import { requestForVaultFeed } from "../utils";

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
