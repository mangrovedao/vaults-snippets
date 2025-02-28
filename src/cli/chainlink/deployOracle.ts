import type { Hex } from "viem";

import type { Token } from "@mangrovedao/mgv";
import { zeroAddress, type Address, type Client } from "viem";
import type { RegistryEntry } from "../../registry";
import {
  getFeeds,
} from "../../oracle/chainlink/get-feeds";
import { chooseFeed } from "./chose-feed";
import inquirer from "inquirer";
import { deployOracle } from "../../oracle/factory";
import { logger } from "../../utils/logger";
import { randomBytes } from "crypto";

export async function deployOracleWithChoice(
  client: Client,
  base: Token,
  quote: Token,
  registry: RegistryEntry,
  sender: Address,
  intermediaryDecimals: number = 18
): Promise<Address | false> {
  const feeds = await getFeeds(registry.chainlinkMetadataLink);

  console.log(`Browse feeds to compose: ${base.symbol}/${quote.symbol}`);
  console.log(
    "You will be asked the number of base and quote feeds to choose from"
  );
  await chooseFeed(
    feeds,
    `bowse feeds to compose: ${base.symbol}/${quote.symbol}:`
  );

  const { nBase, nQuote } = (await inquirer.prompt([
    {
      type: "number",
      name: "nBase",
      message: `How many base feeds to choose from?`,
      default: 0,
      validate: (value: number | undefined) => {
        if (value === undefined) return true;
        if (value > 2) return "You can only choose up to 2 base feeds";
        if (value < 0) return "cannot choose negative number of feeds";
        return true;
      },
    },
    {
      type: "number",
      name: "nQuote",
      message: `How many quote feeds to choose from?`,
      default: 0,
      validate: (value: number | undefined) => {
        if (value === undefined) return true;
        if (value > 2) return "You can only choose up to 2 quote feeds";
        if (value < 0) return "cannot choose negative number of feeds";
        return true;
      },
    },
  ])) as { nBase: number; nQuote: number };

  const baseFeed1 =
    nBase > 0
      ? (
          await chooseFeed(
            feeds,
            `Choose base feed 1 for ${base.symbol}/${quote.symbol}`
          )
        ).proxyAddress
      : zeroAddress;
  const baseFeed2 =
    nBase > 1
      ? (
          await chooseFeed(
            feeds,
            `Choose base feed 2 for ${base.symbol}/${quote.symbol}`
          )
        ).proxyAddress
      : zeroAddress;
  const quoteFeed1 =
    nQuote > 0
      ? (
          await chooseFeed(
            feeds,
            `Choose quote feed 1 for ${base.symbol}/${quote.symbol}`
          )
        ).proxyAddress
      : zeroAddress;
  const quoteFeed2 =
    nQuote > 1
      ? (
          await chooseFeed(
            feeds,
            `Choose quote feed 2 for ${base.symbol}/${quote.symbol}`
          )
        ).proxyAddress
      : zeroAddress;

  function isZeroAddress(address: Address) {
    return address === zeroAddress;
  }

  const args = {
    baseFeed1: isZeroAddress(baseFeed1)
      ? undefined
      : {
          feed: baseFeed1,
          baseDecimals: BigInt(base.decimals),
          quoteDecimals:
            nBase > 1 || nQuote > 0
              ? BigInt(intermediaryDecimals)
              : BigInt(quote.decimals), // if there are following feeds, use intermediary decimals, otherwise use quote decimals
        },
    baseFeed2: isZeroAddress(baseFeed2)
      ? undefined
      : {
          feed: baseFeed2,
          baseDecimals: BigInt(intermediaryDecimals),
          quoteDecimals:
            nQuote > 0 ? BigInt(intermediaryDecimals) : BigInt(quote.decimals), // if there are following feeds, use intermediary decimals, otherwise use quote decimals
        },
    quoteFeed1: isZeroAddress(quoteFeed1)
      ? undefined
      : {
          feed: quoteFeed1,
          quoteDecimals:
            nBase > 0 ? BigInt(intermediaryDecimals) : BigInt(base.decimals),
          baseDecimals:
            nQuote > 1 ? BigInt(intermediaryDecimals) : BigInt(quote.decimals),
        },
    quoteFeed2: isZeroAddress(quoteFeed2)
      ? undefined
      : {
          feed: quoteFeed2,
          quoteDecimals: BigInt(intermediaryDecimals),
          baseDecimals: BigInt(quote.decimals),
        },
  };

  const { confirm } = (await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: `An oracle with the folowwing argument will be deployed: \n
      base feed 1: ${
        args.baseFeed1
          ? `feed with address ${args.baseFeed1.feed}, base decimals ${args.baseFeed1.baseDecimals}, quote decimals ${args.baseFeed1.quoteDecimals}`
          : "none"
      }
      base feed 2: ${
        args.baseFeed2
          ? `feed with address ${args.baseFeed2.feed}, base decimals ${args.baseFeed2.baseDecimals}, quote decimals ${args.baseFeed2.quoteDecimals}`
          : "none"
      }
      quote feed 1: ${
        args.quoteFeed1
          ? `feed with address ${args.quoteFeed1.feed}, base decimals ${args.quoteFeed1.baseDecimals}, quote decimals ${args.quoteFeed1.quoteDecimals}`
          : "none"
      }
      quote feed 2: ${
        args.quoteFeed2
          ? `feed with address ${args.quoteFeed2.feed}, base decimals ${args.quoteFeed2.baseDecimals}, quote decimals ${args.quoteFeed2.quoteDecimals}`
          : "none"
      }
      `,
      default: true,
    },
  ])) as { confirm: boolean };

  if (!confirm) {
    logger.info("Oracle deployment cancelled");
    return false;
  }

  try {
    const oracle = await deployOracle(
      client,
      registry.vault.ORACLE_FACTORY,
      sender,
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
      for (let i = 0; i < 10; i++) {
        logger.info(`Retrying...`);
        try {
          const _oracle = await deployOracle(
            client,
            registry.vault.ORACLE_FACTORY,
            sender,
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
