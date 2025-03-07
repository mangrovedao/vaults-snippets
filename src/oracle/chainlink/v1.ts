/**
 * Chainlink Oracle V1 Module
 * 
 * This module provides functionality for deploying Chainlink V1 oracles for Mangrove.
 * It handles the deployment process through the MangroveChainlinkOracleFactory contract.
 */
import { toHex, zeroAddress, type Address, type Client, type Hex } from "viem";
import { logger } from "../../utils/logger";
import { simulateContract } from "viem/actions";
import { MangroveChainlinkOracleFactoryAbi } from "../../../abis/MangroveChainlinkOracleFactory";

/**
 * Represents a Chainlink price feed configuration
 * 
 * @property feed - The address of the Chainlink price feed contract
 * @property baseDecimals - The number of decimals for the base asset
 * @property quoteDecimals - The number of decimals for the quote asset
 */
export type ChainlinkFeed = {
  feed: Address;
  baseDecimals: bigint;
  quoteDecimals: bigint;
};

/**
 * Arguments for deploying a Chainlink V1 Oracle
 * 
 * @property baseFeed1 - Primary price feed for the base asset (optional)
 * @property baseFeed2 - Secondary price feed for the base asset (optional)
 * @property quoteFeed1 - Primary price feed for the quote asset (optional)
 * @property quoteFeed2 - Secondary price feed for the quote asset (optional)
 * @property salt - Unique salt value for deterministic deployment (optional)
 */
export type DeployChainlinkV1OracleArgs = {
  baseFeed1?: ChainlinkFeed;
  baseFeed2?: ChainlinkFeed;
  quoteFeed1?: ChainlinkFeed;
  quoteFeed2?: ChainlinkFeed;
  salt?: Hex;
};

/**
 * Default feed configuration used when a feed is not provided
 */
const DEFAULT_FEED = {
  feed: zeroAddress,
  baseDecimals: 0n,
  quoteDecimals: 0n,
};

/**
 * Deploys a Chainlink V1 Oracle through the MangroveChainlinkOracleFactory
 * 
 * This function:
 * 1. Validates that at least one feed is provided
 * 2. Simulates the contract deployment to get the expected address
 * 3. Executes the deployment transaction
 * 4. Returns the deployed oracle address if successful
 * 
 * @param client - The blockchain client used for the deployment
 * @param oracleFactory - The address of the MangroveChainlinkOracleFactory contract
 * @param args - Configuration arguments for the oracle deployment
 * @param noThrow - Whether to suppress errors (true) or throw them (false)
 * @returns The address of the deployed oracle if successful, undefined otherwise
 */
export async function deployChainlinkV1Oracle(
  client: Client,
  oracleFactory: Address,
  args: DeployChainlinkV1OracleArgs,
  noThrow: boolean = true
): Promise<Address | undefined> {
  try {
    // Validate that at least one feed is provided
    if (
      !args.baseFeed1 &&
      !args.baseFeed2 &&
      !args.quoteFeed1 &&
      !args.quoteFeed2
    ) {
      logger.error("no feed provided at all");
      return undefined;
    }

    // Use provided feeds or default to zero values
    const baseFeed1 = args.baseFeed1 ?? DEFAULT_FEED;
    const baseFeed2 = args.baseFeed2 ?? DEFAULT_FEED;
    const quoteFeed1 = args.quoteFeed1 ?? DEFAULT_FEED;
    const quoteFeed2 = args.quoteFeed2 ?? DEFAULT_FEED;

    // Simulate the contract deployment to get the expected oracle address
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

    // Execute the deployment transaction and log the process
    const receipt = await logger.handleRequest(deployOracleRequest, client, {
      header: `oracle will be deployed at ${oracle}`,
      success: (block, hash) =>
        `oracle deployed at ${oracle} in block ${block}: ${hash}`,
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