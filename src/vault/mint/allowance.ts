import inquirer from "inquirer";
import { erc20Abi, formatUnits, type Address, type Client } from "viem";
import { multicall, simulateContract } from "viem/actions";
import { logger } from "../../utils/logger";

export type AllowanceEntry = {
  token: Address;
  amount: bigint;
  spender: Address;
  tokenDecimals?: number;
  tokenSymbol?: string;
};

async function approve(client: Client, allowance: AllowanceEntry) {
  const formattedAmount = allowance.tokenDecimals
    ? `${formatUnits(allowance.amount, allowance.tokenDecimals)} ${
        allowance.tokenSymbol ?? "token"
      }`
    : `${allowance.amount} ${allowance.tokenSymbol ?? "token"}`;
  const { confirm } = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `Approve ${formattedAmount} to ${allowance.spender}?`,
  });
  if (!confirm) {
    return;
  }
  const { request } = await simulateContract(client, {
    address: allowance.token,
    abi: erc20Abi,
    functionName: "approve",
    args: [allowance.spender, allowance.amount],
    account: client.account,
  });
  const receipt = await logger.handleRequest(request, client, {
    header: `approving ${formattedAmount} to ${allowance.spender}`,
    success: (block, hash) =>
      `approved ${formattedAmount} to ${allowance.spender} in block ${block}: ${hash}`,
    failure: (hash) =>
      `approval of ${formattedAmount} to ${allowance.spender} failed: ${hash}`,
    label: "Approving",
  });
  return receipt.status === "success";
}

export async function giveAllowanceIfNeeded(
  client: Client,
  account: Address,
  allowances: AllowanceEntry[]
) {
  const results = await multicall(client, {
    contracts: allowances.map(
      (allowance) =>
        ({
          address: allowance.token,
          abi: erc20Abi,
          functionName: "allowance",
          args: [account, allowance.spender],
        } as const)
    ),
    allowFailure: false,
  });

  for (let i = 0; i < allowances.length; i++) {
    const allowance = allowances[i];
    const result = results[i];
    if (result < allowance.amount) {
      const success = await approve(client, allowance);
      if (!success) {
        return false;
      }
    }
  }
  return true;
}
