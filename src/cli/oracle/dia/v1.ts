import type { Token } from "@mangrovedao/mgv";
import type { Address, Client } from "viem";
import { selectDiaFeeds } from "./utils";
import { requestForVaultFeed } from "../utils";
import { deployDiaV1Oracle } from "../../../oracle/dia/v1";

export async function deployDiaV1OracleForm(
  client: Client,
  base: Token,
  quote: Token,
  oracleFactory: Address,
  intermediaryDecimals: number = 18
) {
  const args = await selectDiaFeeds(base, quote, intermediaryDecimals);
  const baseVault = await requestForVaultFeed(client, "Choose a base vault");
  const quoteVault = await requestForVaultFeed(client, "Choose a quote vault");
  const oracle = await deployDiaV1Oracle(
    client,
    oracleFactory,
    {
      ...args,
      baseVault,
      quoteVault,
    }
  );
  if (!oracle) {
    throw new Error("Failed to deploy Oracle");
  }
  return oracle;
}
