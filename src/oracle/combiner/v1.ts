import { toHex, zeroAddress, type Address, type Client, type Hex } from "viem";
import { combinerFactoryABI } from "../../../abis/oracles/combiner/factory";
import { getCode, readContract, simulateContract } from "viem/actions";
import { logger } from "../../utils/logger";

export type CombinerV1DeployArgs = {
  feed1?: Address;
  feed2?: Address;
  feed3?: Address;
  feed4?: Address;
  salt?: Hex;
};

function validateArgs(args: CombinerV1DeployArgs) {
  if (
    !args.feed1 &&
    !args.feed2 &&
    !args.feed3 &&
    !args.feed4
  ) {
    return undefined;
  }
  return {
    feed1: args.feed1 ?? zeroAddress,
    feed2: args.feed2 ?? zeroAddress,
    feed3: args.feed3 ?? zeroAddress,
    feed4: args.feed4 ?? zeroAddress,
  };
}

export async function getCombinerV1Address(
  client: Client,
  oracleFactory: Address,
  args: CombinerV1DeployArgs
) {
  const validatedArgs = validateArgs(args);
  if (!validatedArgs) {
    return undefined;
  }
  const { feed1, feed2, feed3, feed4 } = validatedArgs;
  const address = await readContract(client, {
    address: oracleFactory,
    abi: combinerFactoryABI,
    functionName: "computeOracleAddress",
    args: [
      feed1,
      feed2,
      feed3,
      feed4,
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

export async function deployCombinerV1Oracle(
  client: Client,
  oracleFactory: Address,
  args: CombinerV1DeployArgs,
  noThrow: boolean = true
): Promise<Address | undefined> {
  try {
    const validatedArgs = validateArgs(args);
    if (!validatedArgs) {
      logger.error("no feed provided at all");
      return undefined;
    }

    const { feed1, feed2, feed3, feed4 } = validatedArgs;

    const oracleAddress = await getCombinerV1Address(
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
        abi: combinerFactoryABI,
        functionName: "create",
        args: [
          feed1,
          feed2,
          feed3,
          feed4,
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
    return undefined;
  }
}
