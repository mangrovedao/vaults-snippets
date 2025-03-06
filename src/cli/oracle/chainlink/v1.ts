import type { Hex } from "viem";

import type { Token } from "@mangrovedao/mgv";
import { zeroAddress, type Address, type Client } from "viem";
import type { RegistryEntry } from "../../../registry";
import { getFeeds } from "../../../oracle/chainlink/get-feeds";
import { chooseChainlinkFeeds, chooseFeed } from "./chose-feed";
import inquirer from "inquirer";
import { logger } from "../../../utils/logger";
import { randomBytes } from "crypto";
import { selectAddress } from "../../select";
import { deployChainlinkV1Oracle } from "../../../oracle/chainlink/v1";
import ora from "ora";

export async function deployChainlinkV1OracleForm(
  client: Client,
  base: Token,
  quote: Token,
  oracleFactory: Address,
  sender: Address,
  chainlinkMetadataLink: string,
  intermediaryDecimals: number = 18
): Promise<Address | false> {
  const spinner = ora(
    `Getting feeds from ${chainlinkMetadataLink}`
  ).start();
  const feeds = await getFeeds(chainlinkMetadataLink);
  spinner.succeed(`Got ${feeds.length} feeds`);

  try {
    const args = await chooseChainlinkFeeds(feeds, base, quote, intermediaryDecimals);
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
      const args = await chooseChainlinkFeeds(feeds, base, quote, intermediaryDecimals);
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
