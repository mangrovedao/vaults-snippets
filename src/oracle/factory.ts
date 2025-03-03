import { toHex, zeroAddress, type Address, type Client, type Hex } from "viem";
import { logger } from "../utils/logger";
import {
  simulateContract,
  writeContract,
  waitForTransactionReceipt,
} from "viem/actions";
import { MangroveChainlinkOracleFactoryAbi } from "../../abis/MangroveChainlinkOracleFactory";

export type Feed = {
  feed: Address;
  baseDecimals: bigint;
  quoteDecimals: bigint;
};

export type DeployOracleArgs = {
  baseFeed1?: Feed;
  baseFeed2?: Feed;
  quoteFeed1?: Feed;
  quoteFeed2?: Feed;
  salt?: Hex;
};

const DEFAULT_FEED = {
  feed: zeroAddress,
  baseDecimals: 0n,
  quoteDecimals: 0n,
};

export async function deployOracle(
  client: Client,
  oracleFactory: Address,
  sender: Address,
  args: DeployOracleArgs,
  noThrow: boolean = true
): Promise<Address | undefined> {
  try {
    if (
      !args.baseFeed1 &&
      !args.baseFeed2 &&
      !args.quoteFeed1 &&
      !args.quoteFeed2
    ) {
      logger.error("no feed provided at all");
      return undefined;
    }

    const baseFeed1 = args.baseFeed1 ?? DEFAULT_FEED;
    const baseFeed2 = args.baseFeed2 ?? DEFAULT_FEED;
    const quoteFeed1 = args.quoteFeed1 ?? DEFAULT_FEED;
    const quoteFeed2 = args.quoteFeed2 ?? DEFAULT_FEED;

    const { result: oracle, request: deployOracleRequest } =
      await simulateContract(client, {
        address: oracleFactory,
        abi: MangroveChainlinkOracleFactoryAbi,
        functionName: "create",
        args: [
          baseFeed1,
          baseFeed2,
          quoteFeed1,
          quoteFeed2,
          args.salt ?? toHex(0, { size: 0x20 }),
        ],
        account: client.account,
      });

    const receipt = await logger.handleRequest(deployOracleRequest, client, {
      header: `oracle will be deployed at ${oracle}`,
      success: (block, hash) => `oracle deployed at ${oracle} in block ${block}: ${hash}`,
      failure: (hash) => `oracle deployment failed at ${oracle}: ${hash}`,
      label: "Oracle deployment",
    });

    return receipt.status === "success" ? oracle : undefined;
  } catch (error) {
    if (!noThrow) {
      throw error;
    }
    logger.error(error);
    return undefined;
  }
}
