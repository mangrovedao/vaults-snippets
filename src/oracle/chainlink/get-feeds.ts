import { isAddress, isAddressEqual, zeroAddress, type Address } from "viem";

export type ChainLinkFeedDoc = {
  contractAddress: Address;
  proxyAddress: Address;
  pair: [string, string];
  feedType: "Crypto";
  decimals: number;
  hidden: boolean;
};

export async function getFeeds(
  chainlinkMetadataLink: string
): Promise<ChainLinkFeedDoc[]> {
  const response = await fetch(chainlinkMetadataLink);
  const data = await response.json();
  return data
    .filter((f: ChainLinkFeedDoc) => {
      return (
        f.feedType === "Crypto" &&
        !isAddressEqual(f.contractAddress, zeroAddress) &&
        f.pair.length === 2 &&
        typeof f.decimals === "number" &&
        f.decimals > 0 &&
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
          hidden: (f as any).docs.hidden || false,
        } as ChainLinkFeedDoc)
    );
}
