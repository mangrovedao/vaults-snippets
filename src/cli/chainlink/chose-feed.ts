import { isAddressEqual } from "viem";
import type { ChainLinkFeedDoc } from "../../oracle/chainlink/get-feeds";
import autocomplete from "inquirer-autocomplete-standalone";

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

export async function chooseFeed(feeds: ChainLinkFeedDoc[], message = "Find a Chainlink feed") {
  return autocomplete({
    message,
    source: async (input) => {
      const searchTerm = (input || "").toLowerCase();
      const feedsWithScores = feeds
        .filter((f) => !f.hidden)
        .map((feed) => ({
          ...feed,
          score: scoreForFeed(feed, searchTerm),
        }));
      return feedsWithScores
        .sort((a, b) => b.score - a.score)
        .map((feed) => ({
          value: feed,
          name: `${feed.pair.join("/")} (${feed.proxyAddress})`,
        }));
    },
  });
}
