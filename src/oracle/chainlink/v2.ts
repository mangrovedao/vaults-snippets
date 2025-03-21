/**
 * Chainlink V2 Oracle Implementation Module
 * 
 * This module provides the core functionality for deploying and interacting with
 * Chainlink V2 oracles. The V2 version supports complex configurations with
 * multiple price feeds and vault integrations for better price accuracy.
 * 
 * @module oracle/chainlink/v2
 */
import { toHex, zeroAddress, type Address, type Client, type Hex } from "viem";
import type { ChainlinkFeed } from "./v1";
import { logger } from "../../utils/logger";
import { getCode, readContract, simulateContract } from "viem/actions";
import { chainlinkOracleFactoryV2ABI } from "../../../abis/oracles/chainlink-v2/factory";

/**
 * Represents a vault feed configuration
 * 
 * @property vault - The address of the vault contract
 * @property conversionSample - The conversion sample value as a bigint
 */
export type VaultFeed = {
  vault: Address;
  conversionSample: bigint;
};

/**
 * Arguments for deploying a Chainlink V2 Oracle
 * 
 * @property baseFeed1 - Optional primary price feed for the base token
 * @property baseFeed2 - Optional secondary price feed for the base token
 * @property quoteFeed1 - Optional primary price feed for the quote token
 * @property quoteFeed2 - Optional secondary price feed for the quote token
 * @property baseVault - Optional vault feed for the base token
 * @property quoteVault - Optional vault feed for the quote token
 * @property salt - Optional salt for deterministic deployment
 */
export type DeployChainlinkV2OracleArgs = {
  baseFeed1?: ChainlinkFeed;
  baseFeed2?: ChainlinkFeed;
  quoteFeed1?: ChainlinkFeed;
  quoteFeed2?: ChainlinkFeed;
  baseVault?: VaultFeed;
  quoteVault?: VaultFeed;
  salt?: Hex;
};

const DEFAULT_FEED = {
  feed: zeroAddress,
  baseDecimals: 0n,
  quoteDecimals: 0n,
};

const DEFAULT_VAULT = {
  vault: zeroAddress,
  conversionSample: 0n,
};

/**
 * Validates the provided arguments for oracle deployment
 * 
 * Ensures that at least one feed or vault is provided and fills in defaults for missing values.
 * 
 * @param args - The arguments to validate
 * @returns The validated arguments with defaults applied, or undefined if validation fails
 */
function validateArgs(args: DeployChainlinkV2OracleArgs) {
  if (
    !args.baseFeed1 &&
    !args.baseFeed2 &&
    !args.quoteFeed1 &&
    !args.quoteFeed2 &&
    !args.baseVault &&
    !args.quoteVault
  ) {
    logger.error("no feed provided at all");
    return undefined;
  }
  return {
    baseFeed1: args.baseFeed1 ?? DEFAULT_FEED,
    baseFeed2: args.baseFeed2 ?? DEFAULT_FEED,
    quoteFeed1: args.quoteFeed1 ?? DEFAULT_FEED,
    quoteFeed2: args.quoteFeed2 ?? DEFAULT_FEED,
    baseVault: args.baseVault ?? DEFAULT_VAULT,
    quoteVault: args.quoteVault ?? DEFAULT_VAULT,
  };
}

/**
 * Gets the address of a Chainlink V2 Oracle
 * 
 * Computes the deterministic address where the oracle will be deployed or is already deployed.
 * 
 * @param client - The blockchain client
 * @param oracleFactory - The address of the oracle factory contract
 * @param args - Arguments for deploying the oracle
 * @returns Object containing the oracle address and deployment status, or undefined if validation fails
 */
export async function getChainlinkV2OracleAddress(
  client: Client,
  oracleFactory: Address,
  args: DeployChainlinkV2OracleArgs
) {
  const validatedArgs = validateArgs(args);
  if (!validatedArgs) {
    return undefined;
  }
  const {
    baseFeed1,
    baseFeed2,
    quoteFeed1,
    quoteFeed2,
    baseVault,
    quoteVault,
  } = validatedArgs;

  const address = await readContract(client, {
    address: oracleFactory,
    abi: chainlinkOracleFactoryV2ABI,
    functionName: "computeOracleAddress",
    args: [
      baseFeed1,
      baseFeed2,
      quoteFeed1,
      quoteFeed2,
      baseVault,
      quoteVault,
      args.salt ?? toHex(0, { size: 0x20 }),
    ],
  });
  const bytecode = await getCode(client, {
    address,
  });
  return {
    address,
    deployed: !!bytecode,
  };
}

/**
 * Deploys a Chainlink V2 Oracle
 * 
 * This function performs the following:
 * 1. Checks if the oracle is already deployed at the deterministic address
 * 2. Validates the provided arguments
 * 3. Simulates the deployment transaction
 * 4. Executes the deployment if the simulation succeeds
 * 
 * @param client - The blockchain client
 * @param oracleFactory - The address of the oracle factory contract
 * @param args - Arguments for deploying the oracle
 * @param noThrow - Whether to suppress errors (defaults to true)
 * @returns The address of the deployed oracle, or undefined if deployment fails
 */
export async function deployChainlinkV2Oracle(
  client: Client,
  oracleFactory: Address,
  args: DeployChainlinkV2OracleArgs,
  noThrow: boolean = true
) {
  try {
    const oracleAddress = await getChainlinkV2OracleAddress(
      client,
      oracleFactory,
      args
    );
    if (oracleAddress?.deployed) {
      logger.info(`Oracle already deployed at ${oracleAddress.address}`);
      return oracleAddress.address;
    }
    const validatedArgs = validateArgs(args);
    if (!validatedArgs) {
      return undefined;
    }
    const {
      baseFeed1,
      baseFeed2,
      quoteFeed1,
      quoteFeed2,
      baseVault,
      quoteVault,
    } = validatedArgs;

    const { result: oracle, request: deployOracleRequest } =
      await simulateContract(client, {
        address: oracleFactory,
        abi: chainlinkOracleFactoryV2ABI,
        functionName: "create",
        args: [
          baseFeed1,
          baseFeed2,
          quoteFeed1,
          quoteFeed2,
          baseVault,
          quoteVault,
          args.salt ?? toHex(0, { size: 0x20 }),
        ],
        account: client.account,
      });
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
  }
}
