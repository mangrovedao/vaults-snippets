import type { Client, Address } from "viem";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { logger } from "../utils/logger";

export async function addToWhitelist(
  client: Client,
  sender: Address,
  vault: Address,
  swapContract: Address
): Promise<boolean> {
  try {
    logger.info(`Allowing ${vault} to use ${swapContract}`);
    const { request } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "allowSwapContract",
      args: [swapContract],
      account: sender,
    });

    const tx = await writeContract(client, request);
    logger.info(`Waiting for transaction ${tx} to be mined...`);
    const receipt = await waitForTransactionReceipt(client, {
      hash: tx,
    });
    if (receipt.status === "success") {
      logger.info("Transaction mined");
      return true;
    } else {
      logger.error("Transaction failed");
      return false;
    }
  } catch (error) {
    logger.error(error);
    return false;
  }
}

export async function removeFromWhitelist(
  client: Client,
  sender: Address,
  vault: Address,
  swapContract: Address
): Promise<boolean> {
  try {
    logger.info(`Disallowing ${vault} from using ${swapContract}`);
    const { request } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "disallowSwapContract",
      args: [swapContract],
      account: client.account,
    });

    const tx = await writeContract(client, request);
    logger.info(`Waiting for transaction ${tx} to be mined...`);
    const receipt = await waitForTransactionReceipt(client, {
      hash: tx,
    });
    if (receipt.status === "success") {
      logger.info("Transaction mined");
      return true;
    } else {
      logger.error("Transaction failed");
      return false;
    }
  } catch (error) {
    logger.error(error);
    return false;
  }
}
