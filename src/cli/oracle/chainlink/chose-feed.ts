import { isAddressEqual, zeroAddress, type Address } from "viem";
import type { ChainLinkFeedDoc } from "../../../oracle/chainlink/get-feeds";
import autocomplete from "inquirer-autocomplete-standalone";
import inquirer from "inquirer";
import { selectAddress } from "../../select";
import type { Token } from "@mangrovedao/mgv";
import type { ChainlinkFeed } from "../../../oracle/chainlink/v1";
import { logger } from "../../../utils/logger";

/**
 * Score a feed based on how well it matches the search term
 * @param feed - The feed to score
 * @param searchTerm - The search term
 * @returns A score, the higher the better
 *
 * Scoring criteria:
 * - Exact base/quote match (e.g. "ETH/USD" matches "ETH/USD"): 1000 points
 * - Address match (if search is 0x... or >=6 hex chars): 500 points
 * - Full token match (e.g. "ETH" matches "ETH/USD"): 100 points
 * - Partial token match (e.g. "ET" matches "ETH/USD"): 10 points
 * - No match: 0 points
 */
function scoreForFeed(feed: ChainLinkFeedDoc, searchTerm: string) {
  const terms = searchTerm
    .toLowerCase()
    .split(" ")
    .flatMap((t) => t.split("/"));
  const pairString = feed.pair.join("/").toLowerCase();

  // Check for exact pair match
  if (pairString === searchTerm.toLowerCase()) {
    return 1000;
  }

  // Check for address match if search looks like an address
  const testForAddress =
    searchTerm.startsWith("0x") ||
    (searchTerm.length >= 6 && /^[0-9a-f]+$/.test(searchTerm.toLowerCase()));
  if (testForAddress) {
    if (feed.contractAddress.toLowerCase().includes(searchTerm.toLowerCase())) {
      return 500;
    }
  }

  // Check for full token matches
  for (const term of terms) {
    if (term && feed.pair.some((token) => token.toLowerCase() === term)) {
      return 100;
    }
  }

  // Check for partial token matches
  for (const term of terms) {
    if (term && feed.pair.some((token) => token.toLowerCase().includes(term))) {
      return 10;
    }
  }

  return 0;
}

export async function chooseChainlinkFeeds(
  base: Token,
  quote: Token,
  intermediaryDecimals: number = 18
): Promise<{
  baseFeed1: ChainlinkFeed | undefined;
  baseFeed2: ChainlinkFeed | undefined;
  quoteFeed1: ChainlinkFeed | undefined;
  quoteFeed2: ChainlinkFeed | undefined;
}> {
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
  ])) as { nBase: number; nQuote: number; };

  const baseFeed1 =
    nBase > 0
      ? await selectAddress(
          `Choose base feed 1 for ${base.symbol}/${quote.symbol}`
        )
      : zeroAddress;
  const baseFeed2 =
    nBase > 1
      ? await selectAddress(
          `Choose base feed 2 for ${base.symbol}/${quote.symbol}`
        )
      : zeroAddress;
  const quoteFeed1 =
    nQuote > 0
      ? await selectAddress(
          `Choose quote feed 1 for ${base.symbol}/${quote.symbol}`
        )
      : zeroAddress;
  const quoteFeed2 =
    nQuote > 1
      ? await selectAddress(
          `Choose quote feed 2 for ${base.symbol}/${quote.symbol}`
        )
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
    throw new Error("Oracle deployment cancelled");
  }

  return args;
}

