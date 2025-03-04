import type { Address, Client } from "viem";
import { readContract } from "viem/actions";
import { MangroveVaultAbi } from "../../../abis/MangroveVault";

export async function getMintAmounts(
  client: Client,
  vault: Address,
  maxBaseAmount: bigint,
  maxQuoteAmount: bigint
): Promise<{ baseAmount: bigint; quoteAmount: bigint; shares: bigint }> {
  const [baseAmount, quoteAmount, shares] = await readContract(client, {
    address: vault,
    abi: MangroveVaultAbi,
    functionName: "getMintAmounts",
    args: [maxBaseAmount, maxQuoteAmount],
  });
  return { baseAmount, quoteAmount, shares };
}
