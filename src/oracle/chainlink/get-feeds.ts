/**
 * Chainlink Price Feed Module
 * 
 * This module provides functionality for retrieving and filtering Chainlink price feed data.
 * It handles fetching feed metadata from Chainlink's API and processing it into a usable format.
 */
import { isAddress, isAddressEqual, zeroAddress, type Address } from "viem";

/**
 * Represents a Chainlink price feed document with essential metadata
 * 
 * @property contractAddress - The address of the actual feed contract
 * @property proxyAddress - The proxy address used to access the feed (recommended for integration)
 * @property pair - Array containing the base and quote asset symbols (e.g., ["ETH", "USD"])
 * @property feedType - The type of feed (currently only supporting "Crypto" feeds)
 * @property decimals - The number of decimals used in the feed's price representation
 * @property hidden - Whether the feed is marked as hidden in the Chainlink documentation
 */
export type ChainLinkFeedDoc = {
  contractAddress: Address;
  proxyAddress: Address;
  pair: [string, string];
  feedType: "Crypto";
  decimals: number;
  hidden: boolean;
};

/**
 * Fetches and filters Chainlink price feed data from the provided metadata URL
 * 
 * This function:
 * 1. Fetches the raw feed data from Chainlink's metadata endpoint
 * 2. Filters the feeds to include only valid crypto feeds with proper configuration
 * 3. Transforms the data into a consistent format with appropriate typing
 * 
 * @param chainlinkMetadataLink - URL to the Chainlink feed metadata JSON
 * @returns A promise resolving to an array of filtered and formatted ChainLinkFeedDoc objects
 */
export async function getFeeds(
  chainlinkMetadataLink: string
): Promise<ChainLinkFeedDoc[]> {
  // Fetch raw feed data from Chainlink
  const response = await fetch(chainlinkMetadataLink);
  const data = await response.json();
  
  // Filter feeds to include only valid crypto feeds
  return data
    .filter((f: ChainLinkFeedDoc) => {
      return (
        // Only include crypto feeds
        f.feedType === "Crypto" &&
        // Ensure contract address is valid and not zero
        !isAddressEqual(f.contractAddress, zeroAddress) &&
        // Ensure pair has exactly two elements (base/quote)
        f.pair.length === 2 &&
        // Verify decimals is a number and positive
        typeof f.decimals === "number" &&
        f.decimals > 0 &&
        // Ensure proxy address is a valid address and not zero
        isAddress(f.proxyAddress) &&
        !isAddressEqual(f.proxyAddress, zeroAddress)
      );
    })
    .map(
      (f: ChainLinkFeedDoc) =>
        ({
          contractAddress: f.contractAddress,
          proxyAddress: f.proxyAddress,
          pair: f.pair,
          feedType: f.feedType,
          decimals: f.decimals,
          // Extract hidden property from docs or default to false
          hidden: (f as any).docs.hidden || false,
        } as ChainLinkFeedDoc)
    );
}
