import type { Address, Client } from "viem";
import { logger } from "../utils/logger";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";

export enum FundsState {
  Vault = 0,
  Passive = 1,
  Active = 2,
}

export type Params = {
  gasprice: number;
  gasreq: number;
  stepSize: number;
  pricePoints: number;
};

export type PositionData = {
  tickIndex0: bigint;
  tickOffset: bigint;
  params: Params;
  fundsState: FundsState;
};

function fundsStateToString(fundsState: FundsState) {
  switch (fundsState) {
    case FundsState.Vault:
      return "Vault (funds will stay in vault)";
    case FundsState.Passive:
      return "Passive (funds will be on the kandel contract with no active position)";
    case FundsState.Active:
      return "Active (funds will be on the kandel contract with an active position)";
  }
}

export async function setPosition(
  client: Client,
  vault: Address,
  data: PositionData
) {
  try {
    logger.info(`setting position for vault ${vault} with data:`);
    logger.info(`first tick index: ${data.tickIndex0}`);
    logger.info(`tick offset: ${data.tickOffset}`);
    logger.info(
      `gas price: ${
        data.params.gasprice === 0
          ? "unchanged or default"
          : data.params.gasprice
      }`
    );
    logger.info(
      `gasreq: ${
        data.params.gasreq === 0 ? "unchanged or default" : data.params.gasreq
      }`
    );
    logger.info(`step size: ${data.params.stepSize}`);
    logger.info(`price points: ${data.params.pricePoints}`);
    logger.info(`funds state: ${fundsStateToString(data.fundsState)}`);

    const { request: setPositionRequest } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "setPosition",
      args: [data],
      account: client.account,
    });

    const receipt = await logger.handleRequest(setPositionRequest, client, {
      header: `setting position for vault ${vault} with data:`,
      success: (block, hash) => `position set for vault ${vault} in block ${block}: ${hash}`,
      failure: (hash) => `position not set for vault ${vault}: ${hash}`,
      label: "Position setting",
    });
    return receipt.status === "success";
  } catch (error) {
    logger.error(error);
    return false;
  }
}

export async function refreshPosition(
  client: Client,
  vault: Address,
  sender: Address
): Promise<boolean> {
  try {
    logger.info(
      `refreshing position for vault ${vault} with current parameters`
    );
    const { request: refreshPositionRequest } = await simulateContract(client, {
      address: vault,
      abi: MangroveVaultAbi,
      functionName: "updatePosition",
      account: sender,
    });
    const receipt = await logger.handleRequest(refreshPositionRequest, client, {
      header: `refreshing position for vault ${vault} with current parameters`,
      success: (block, hash) =>
        `position refreshed for vault ${vault} in block ${block}: ${hash}`,
      failure: (hash) => `position not refreshed for vault ${vault}: ${hash}`,
      label: "Position refreshing",
    });
    return receipt.status === "success";
  } catch (error) {
    logger.error(error);
    return false;
  }
}
