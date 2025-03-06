import { erc20Abi, parseUnits, zeroAddress, type Client } from "viem";
import type { VaultFeed } from "../../oracle/chainlink/v2";
import { selectAddress, selectNumberWithDecimals } from "../select";
import ora from "ora";
import { multicall } from "viem/actions";

export async function requestForVaultFeed(
  client: Client,
  message: string = "Choose a vault"
): Promise<VaultFeed> {
  const vaultAddress = await selectAddress(message, zeroAddress);
  if (vaultAddress === zeroAddress) {
    return {
      vault: zeroAddress,
      conversionSample: 0n,
    };
  }
  const spinner = ora(
    `Fetching default conversion sample for ${vaultAddress}`
  ).start();
  const [decimals, symbol] = await multicall(client, {
    contracts: [
      {
        address: vaultAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: vaultAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
    allowFailure: false,
  });
  spinner.succeed(`Got ${symbol} decimals: ${decimals}`);
  const conversionSample = await selectNumberWithDecimals(
    decimals,
    `Enter a conversion sample in ${symbol}`,
    parseUnits("1", decimals)
  );
  return {
    vault: vaultAddress,
    conversionSample,
  };
}
