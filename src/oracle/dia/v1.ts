/**
 * DIA Oracle V1 Module
 * 
 * This module provides functionality for deploying DIA V1 oracles for Mangrove.
 * It handles the deployment process through the DIA Oracle Factory contract.
 */
import {
  encodePacked,
  toHex,
  zeroAddress,
  type Address,
  type Client,
  type Hex,
} from "viem";
import type { VaultFeed } from "../chainlink/v2";
import { logger } from "../../utils/logger";
import { getCode, readContract, simulateContract } from "viem/actions";
import { diaFactoryABI } from "../../../abis/oracles/dia/factory";

/**
 * Represents a DIA price feed configuration
 * 
 * @property oracle - The address of the DIA oracle contract
 * @property key - The key identifier for the specific price feed
 * @property priceDecimals - The number of decimals in the price representation
 * @property baseDecimals - The number of decimals for the base asset
 * @property quoteDecimals - The number of decimals for the quote asset
 */
export type DiaFeed = {
  oracle: Address;
  key: string;
  priceDecimals: bigint;
  baseDecimals: bigint;
  quoteDecimals: bigint;
};

/**
 * Arguments for deploying a DIA V1 Oracle
 * 
 * @property baseFeed1 - Primary price feed for the base asset (optional)
 * @property baseFeed2 - Secondary price feed for the base asset (optional)
 * @property quoteFeed1 - Primary price feed for the quote asset (optional)
 * @property quoteFeed2 - Secondary price feed for the quote asset (optional)
 * @property baseVault - Vault feed for the base asset (optional)
 * @property quoteVault - Vault feed for the quote asset (optional)
 * @property salt - Unique salt value for deterministic deployment (optional)
 */
export type DeployDiaV1OracleArgs = {
  baseFeed1?: DiaFeed;
  baseFeed2?: DiaFeed;
  quoteFeed1?: DiaFeed;
  quoteFeed2?: DiaFeed;
  baseVault?: VaultFeed;
  quoteVault?: VaultFeed;
  salt?: Hex;
};

/**
 * Default feed configuration used when a feed is not provided
 */
const DEFAULT_FEED = {
  oracle: zeroAddress,
  key: toHex(0n, { size: 0x20 }),
  priceDecimals: 0n,
  baseDecimals: 0n,
  quoteDecimals: 0n,
};

/**
 * Default vault configuration used when a vault is not provided
 */
const DEFAULT_VAULT = {
  vault: zeroAddress,
  conversionSample: 0n,
};

/**
 * Validates a DIA feed configuration
 * 
 * Ensures the key is properly formatted and not too long.
 * 
 * @param feed - The DIA feed to validate
 * @returns The validated feed with properly formatted key
 * @throws Error if the key is too long
 */
function validateFeed(feed?: DiaFeed) {
  if (!feed) {
    return DEFAULT_FEED;
  }
  const keyRaw = encodePacked(["string"], [feed.key]);
  if ((keyRaw.length - 2) / 2 > 32) {
    logger.error("dia key is too long: contact devs");
    throw new Error("dia key is too long");
  }
  return {
    ...feed,
    key: toHex(keyRaw, { size: 0x20 }),
  };
}

/**
 * Validates the provided arguments for oracle deployment
 * 
 * Ensures that at least one feed or vault is provided and validates all feeds.
 * 
 * @param args - The arguments to validate
 * @returns The validated arguments with defaults applied, or undefined if validation fails
 */
function validateArgs(args: DeployDiaV1OracleArgs) {
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
  try {
    const result = {
      baseFeed1: validateFeed(args.baseFeed1),
      baseFeed2: validateFeed(args.baseFeed2),
      quoteFeed1: validateFeed(args.quoteFeed1),
      quoteFeed2: validateFeed(args.quoteFeed2),
      baseVault: args.baseVault ?? DEFAULT_VAULT,
      quoteVault: args.quoteVault ?? DEFAULT_VAULT,
    };
    return result;
  } catch (error) {
    logger.error(error);
    return undefined;
  }
}

/**
 * Gets the address of a DIA V1 Oracle
 * 
 * Computes the deterministic address where the oracle will be deployed or is already deployed.
 * 
 * @param client - The blockchain client
 * @param oracleFactory - The address of the oracle factory contract
 * @param args - Arguments for deploying the oracle
 * @returns Object containing the oracle address and deployment status, or undefined if validation fails
 */
export async function getDiaV1OracleAddress(
  client: Client,
  oracleFactory: Address,
  args: DeployDiaV1OracleArgs
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
    abi: diaFactoryABI,
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
 * Deploys a DIA V1 Oracle through the DIA Oracle Factory
 * 
 * This function:
 * 1. Validates the provided arguments
 * 2. Checks if the oracle is already deployed at the deterministic address
 * 3. Simulates the contract deployment to get the expected address
 * 4. Executes the deployment transaction
 * 5. Returns the deployed oracle address if successful
 * 
 * @param client - The blockchain client used for the deployment
 * @param oracleFactory - The address of the DIA Oracle Factory contract
 * @param args - Configuration arguments for the oracle deployment
 * @returns The address of the deployed oracle if successful, undefined otherwise
 */
export async function deployDiaV1Oracle(
  client: Client,
  oracleFactory: Address,
  args: DeployDiaV1OracleArgs
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
  try {
    const oracleAddress = await getDiaV1OracleAddress(
      client,
      oracleFactory,
      args
    );
    if (oracleAddress?.deployed) {
      logger.info(`Oracle already deployed at ${oracleAddress.address}`);
      return oracleAddress.address;
    }
    const { result: oracle, request: deployOracleRequest } =
      await simulateContract(client, {
        address: oracleFactory,
        abi: diaFactoryABI,
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
    logger.error(error);
    return undefined;
  }
}
