import type { Address, Client } from "viem";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { logger } from "../utils/logger";
import { FEE_PRECISION } from "../utils/constants";

export type FeeData = {
  feeRecipient: Address;
  performanceFee: number; // 1% = 0.01
  managementFee: number; // 1% = 0.01 annual
};

export async function setFee(
  client: Client,
  vault: Address,
  sender: Address,
  data: FeeData
) {
  try {
    logger.info(`setting fee for vault ${vault} with data:`);

    const performanceFee = Math.floor(data.performanceFee * FEE_PRECISION);
    const managementFee = Math.floor(data.managementFee * FEE_PRECISION);

    logger.info(`fee recipient: ${data.feeRecipient}`);
    logger.info(`performance fee: ${(performanceFee * 100) / FEE_PRECISION}%`);
    logger.info(
      `annual management fee: ${(managementFee * 100) / FEE_PRECISION}%`
    );

    const { request: setFeeRequest } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "setFeeData",
      args: [performanceFee, managementFee, data.feeRecipient],
      account: sender,
    });
    const tx = await writeContract(client, setFeeRequest);
    logger.info(`waiting for tx hash: ${tx}`);
    const receipt = await waitForTransactionReceipt(client, { hash: tx });
    if (receipt.status === "success") {
      logger.info(`fee set for vault ${vault}`);
      return true;
    } else {
      logger.error(`fee setting failed for vault ${vault}`);
      return false;
    }
  } catch (error) {
    logger.error(error);
    return false;
  }
}
