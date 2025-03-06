import { toHex, zeroAddress, type Address, type Client, type Hex } from "viem";
import type { ChainlinkFeed } from "./v1";
import { logger } from "../../utils/logger";
import { getCode, readContract, simulateContract } from "viem/actions";
import { chainlinkOracleFactoryV2ABI } from "../../../abis/oracles/chainlink-v2/factory";

export type VaultFeed = {
  vault: Address;
  conversionSample: bigint;
};

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
