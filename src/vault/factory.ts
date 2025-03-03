import type { Address, Client } from "viem";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { MangroveVaultFactoryAbi } from "../../abis/MangroveVaultFactory";
import { logger } from "../utils/logger";

export type DeployVaultArgs = {
  seeder: Address;
  base: Address;
  quote: Address;
  tickSpacing: bigint;
  owner?: Address;
  oracle: Address;
  name: string;
  symbol: string;
  decimals?: number | undefined;
};

export async function deployVault(
  client: Client,
  vaultFactory: Address,
  sender: Address,
  args: DeployVaultArgs
): Promise<Address | undefined> {
  try {
    const { result: vault, request: createVaultRequest } =
      await simulateContract(client, {
        address: vaultFactory,
        abi: MangroveVaultFactoryAbi,
        functionName: "createVault",
        args: [
          args.seeder,
          args.base,
          args.quote,
          args.tickSpacing,
          args.decimals ?? 18,
          args.name,
          args.symbol,
          args.oracle,
          args.owner ?? sender,
        ],
        account: client.account,
      });

    await logger.handleRequest(createVaultRequest, client, {
      header: `creating vault at address ${vault} with`,
      success: (block, hash) => `vault created at address ${vault} in block ${block}: ${hash}`,
      failure: (hash) => `vault creation failed at address ${vault}: ${hash}`,
      label: "Vault creation",
    });
    return vault;
  } catch (error) {
    logger.error(error);
    return undefined;
  }
}
