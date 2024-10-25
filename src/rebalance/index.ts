import type { Client, Address, Hex } from "viem";
import { logger } from "../utils/logger";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";

export type RebalanceArgs = {
  target: Address;
  data: Hex;
  amountOut: bigint;
  amountInMin?: bigint | undefined;
  sell: boolean;
};

export async function rebalance(
  client: Client,
  sender: Address,
  vault: Address,
  args: RebalanceArgs
) {
  try {
    const { request } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "swap",
      args: [
        args.target,
        args.data,
        args.amountOut,
        args.amountInMin ?? 0n,
        args.sell,
      ],
      account: client.account,
    });

    const tx = await writeContract(client, request);
    logger.info(`Waiting for transaction ${tx} to be mined...`);
    const receipt = await waitForTransactionReceipt(client, {
      hash: tx,
    });
    if (receipt.status === "success") {
      logger.info("Transaction mined");
    } else {
      logger.error("Transaction failed");
    }
  } catch (error) {
    logger.error(error);
  }
}
