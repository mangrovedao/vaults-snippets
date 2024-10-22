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
        account: sender,
      });

    logger.info(`creating vault at address ${vault} with params :`, args);
    const tx = await writeContract(client, createVaultRequest);
    logger.info(`waiting for tx hash: ${tx}`);
    const receipt = await waitForTransactionReceipt(client, { hash: tx });
    if (receipt.status === "success") {
      logger.info(`vault created at address ${vault}`);
    } else {
      logger.error(`vault creation failed at address ${vault}`);
    }
    return vault;
  } catch (error) {
    logger.error(error);
    return undefined;
  }
}
