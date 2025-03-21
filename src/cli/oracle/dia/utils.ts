import inquirer from "inquirer";
import {
  encodePacked,
  padHex,
  type Hex,
} from "viem";
import { selectAddress } from "../../select";
import type { DiaFeed } from "../../../oracle/dia/v1";
import type { Token } from "@mangrovedao/mgv";

/**
 * Prompts the user to select a market key for DIA oracle
 * 
 * @param message - The prompt message to display
 * @param defaultValue - Default value for the key
 * @returns The selected key
 */
export async function selectKey(
  message: string = "Select a market key",
  defaultValue: string = ""
) {
  const { key } = (await inquirer.prompt([
    {
      type: "input",
      name: "key",
      message,
      validate: (input: string | undefined) => {
        const encoded = encodePacked(["string"], [input ?? ""]);
        try {
          const padded = padHex(encoded, { size: 32 });
          return true;
        } catch (error) {
          return "Invalid key size: contact support";
        }
      },
      default: defaultValue,
      filter: (input: string | undefined) => {
        return input ?? "";
      },
    },
  ])) as { key: Hex };
  return key;
}

/**
 * Prompts the user to select a DIA feed configuration
 * 
 * @param message - The prompt message to display
 * @returns The selected DIA feed configuration without decimals
 */
export async function selectDiaFeed(
  message: string = "Choose a dia feed"
): Promise<Omit<DiaFeed, "baseDecimals" | "quoteDecimals">> {
  const address = await selectAddress(message);
  const key = await selectKey();
  const { priceDecimals } = (await inquirer.prompt([
    {
      type: "number",
      name: "priceDecimals",
      message: "Enter the price decimals",
      default: 8,
    },
  ])) as { priceDecimals: number };
  return {
    oracle: address,
    key,
    priceDecimals: BigInt(priceDecimals),
  };
}

/**
 * Prompts the user to select DIA feeds for a token pair
 * 
 * This function guides the user through selecting up to two feeds each for
 * the base and quote tokens, configuring the appropriate decimal precision
 * for each feed in the chain.
 * 
 * @param base - The base token
 * @param quote - The quote token
 * @param intermediaryDecimals - Decimal precision for intermediary calculations (default: 18)
 * @returns Configuration object with the selected DIA feeds
 */
export async function selectDiaFeeds(
  base: Token,
  quote: Token,
  intermediaryDecimals: number = 18
): Promise<{
  baseFeed1?: DiaFeed;
  baseFeed2?: DiaFeed;
  quoteFeed1?: DiaFeed;
  quoteFeed2?: DiaFeed;
}> {
  const { nBase, nQuote } = (await inquirer.prompt([
    {
      type: "number",
      name: "nBase",
      message: "Enter the number of base feeds",
      default: 1,
      validate: (input: number | undefined) => {
        if (input === undefined || input < 1 || input > 2) {
          return "Invalid number of base feeds";
        }
        return true;
      },
    },
    {
      type: "number",
      name: "nQuote",
      message: "Enter the number of quote feeds",
      default: 1,
      validate: (input: number | undefined) => {
        if (input === undefined || input < 1 || input > 2) {
          return "Invalid number of quote feeds";
        }
        return true;
      },
    },
  ])) as { nBase: number; nQuote: number };

  const diaFeed1 =
    nBase < 1
      ? undefined
      : await selectDiaFeed(
          `Choose base feed 1 for ${base.symbol}/${quote.symbol}`
        );
  const diaFeed2 =
    nBase < 2
      ? undefined
      : await selectDiaFeed(
          `Choose base feed 2 for ${base.symbol}/${quote.symbol}`
        );
  const diaFeed3 =
    nQuote < 1
      ? undefined
      : await selectDiaFeed(
          `Choose quote feed 1 for ${base.symbol}/${quote.symbol}`
        );
  const diaFeed4 =
    nQuote < 2
      ? undefined
      : await selectDiaFeed(
          `Choose quote feed 2 for ${base.symbol}/${quote.symbol}`
        );

  const args = {
    baseFeed1: !diaFeed1
      ? undefined
      : {
          ...diaFeed1,
          baseDecimals: BigInt(base.decimals),
          quoteDecimals:
            nBase > 1 || nQuote > 0
              ? BigInt(intermediaryDecimals)
              : BigInt(quote.decimals), // if there are following feeds, use intermediary decimals, otherwise use quote decimals
        },
    baseFeed2: !diaFeed2
      ? undefined
      : {
          ...diaFeed2,
          baseDecimals: BigInt(intermediaryDecimals),
          quoteDecimals:
            nQuote > 0 ? BigInt(intermediaryDecimals) : BigInt(quote.decimals), // if there are following feeds, use intermediary decimals, otherwise use quote decimals
        },
    quoteFeed1: !diaFeed3
      ? undefined
      : {
          ...diaFeed3,
          quoteDecimals:
            nBase > 0 ? BigInt(intermediaryDecimals) : BigInt(base.decimals),
          baseDecimals:
            nQuote > 1 ? BigInt(intermediaryDecimals) : BigInt(quote.decimals),
        },
    quoteFeed2: !diaFeed4
      ? undefined
      : {
          ...diaFeed4,
          quoteDecimals: BigInt(intermediaryDecimals),
          baseDecimals: BigInt(quote.decimals),
        },
  };
  return args;
}
