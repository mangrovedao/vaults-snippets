/**
 * Combiner Oracle V1 Module
 * 
 * This module provides functionality for deploying Combiner V1 oracles for Mangrove.
 * It handles the deployment process through the MangroveOracleCombinerFactory contract.
 */
import { toHex, zeroAddress, type Address, type Client, type Hex } from "viem";
import { combinerFactoryABI } from "../../../abis/oracles/combiner/factory";
import { getCode, readContract, simulateContract } from "viem/actions";
import { logger } from "../../utils/logger";

/**
 * Arguments for deploying a Combiner V1 Oracle
 * 
 * @property feed1 - First oracle feed address (optional)
 * @property feed2 - Second oracle feed address (optional)
 * @property feed3 - Third oracle feed address (optional)
 * @property feed4 - Fourth oracle feed address (optional)
 * @property salt - Unique salt value for deterministic deployment (optional)
 */
export type CombinerV1DeployArgs = {
  feed1?: Address;
  feed2?: Address;
  feed3?: Address;
  feed4?: Address;
  salt?: Hex;
};

/**
 * Validates the provided arguments for oracle deployment
 * 
 * Ensures that at least one feed is provided and fills in defaults for missing values.
 * 
 * @param args - The arguments to validate
 * @returns The validated arguments with defaults applied, or undefined if validation fails
 */
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

/**
 * Gets the address of a Combiner V1 Oracle
 * 
 * Computes the deterministic address where the oracle will be deployed or is already deployed.
 * 
 * @param client - The blockchain client
 * @param oracleFactory - The address of the oracle factory contract
 * @param args - Arguments for deploying the oracle
 * @returns Object containing the oracle address and deployment status, or undefined if validation fails
 */
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

/**
 * Deploys a Combiner V1 Oracle through the MangroveOracleCombinerFactory
 * 
 * This function:
 * 1. Validates that at least one feed is provided
 * 2. Checks if the oracle is already deployed at the deterministic address
 * 3. Simulates the contract deployment to get the expected address
 * 4. Executes the deployment transaction
 * 5. Returns the deployed oracle address if successful
 * 
 * @param client - The blockchain client used for the deployment
 * @param oracleFactory - The address of the MangroveOracleCombinerFactory contract
 * @param args - Configuration arguments for the oracle deployment
 * @param noThrow - Whether to suppress errors (true) or throw them (false)
 * @returns The address of the deployed oracle if successful, undefined otherwise
 */
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

    // If oracle is already deployed, return its address
    if (oracleAddress?.deployed) {
      logger.info(`Oracle already deployed at ${oracleAddress.address}`);
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
