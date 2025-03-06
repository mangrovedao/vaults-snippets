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

export type DiaFeed = {
  oracle: Address;
  key: string;
  priceDecimals: bigint;
  baseDecimals: bigint;
  quoteDecimals: bigint;
};

export type DeployDiaV1OracleArgs = {
  baseFeed1?: DiaFeed;
  baseFeed2?: DiaFeed;
  quoteFeed1?: DiaFeed;
  quoteFeed2?: DiaFeed;
  baseVault?: VaultFeed;
  quoteVault?: VaultFeed;
  salt?: Hex;
};

const DEFAULT_FEED = {
  oracle: zeroAddress,
  key: toHex(0n, { size: 0x20 }),
  priceDecimals: 0n,
  baseDecimals: 0n,
  quoteDecimals: 0n,
};

const DEFAULT_VAULT = {
  vault: zeroAddress,
  conversionSample: 0n,
};

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
