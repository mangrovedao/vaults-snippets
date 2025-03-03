import type { Address, Client } from "viem";
import {
  simulateContract,
} from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { logger } from "../utils/logger";
import { FEE_PRECISION } from "../utils/constants";

export type FeeData = {
  feeRecipient: Address;
  performanceFee: number; // 1% = 0.01
  managementFee: number; // 1% = 0.01 annual
};

export async function setFee(client: Client, vault: Address, data: FeeData) {
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
      account: client.account,
    });

    const receipt = await logger.handleRequest(setFeeRequest, client, {
      header: `setting fee for vault ${vault} with data:`,
      success: (block, hash) => `fee set for vault ${vault} in block ${block}: ${hash}`,
      failure: (hash) => `fee setting failed for vault ${vault}: ${hash}`,
      label: "Fee setting",
    });

    return receipt.status === "success";
  } catch (error) {
    logger.error(error);
    return false;
  }
}
