import type { Address, Client } from "viem";
import { simulateContract } from "viem/actions";
import { MangroveVaultAbi } from "../../abis/MangroveVault";
import { logger } from "../utils/logger";

export async function setOwner(
  client: Client,
  vault: Address,
  newOwner: Address
) {
  const { request } = await simulateContract(client, {
    address: vault,
    abi: MangroveVaultAbi,
    functionName: "transferOwnership",
    args: [newOwner],
    account: client.account,
  });

  await logger.handleRequest(request, client, {
    header: `transferring ownership of vault ${vault} to ${newOwner}`,
    success: (block, hash) =>
      `ownership transferred for vault ${vault} in block ${block}: ${hash}`,
    failure: (hash) => `ownership not transferred for vault ${vault}: ${hash}`,
    label: "Ownership transfer",
  });
}

export async function setManager(
  client: Client,
  vault: Address,
  newManager: Address
) {
  const { request } = await simulateContract(client, {
    address: vault,
    abi: MangroveVaultAbi,
    functionName: "setManager",
    args: [newManager],
    account: client.account,
  });

  await logger.handleRequest(request, client, {
    header: `setting manager for vault ${vault} to ${newManager}`,
    success: (block, hash) =>
      `manager set for vault ${vault} in block ${block}: ${hash}`,
    failure: (hash) => `manager not set for vault ${vault}: ${hash}`,
    label: "Manager setting",
  });
}
