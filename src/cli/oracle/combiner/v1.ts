/**
 * Combiner V1 Oracle CLI Module
 * 
 * This module provides the command-line interface functionality for deploying and
 * interacting with Combiner V1 oracles. The Combiner oracle aggregates up to four
 * different oracle feeds into a single price feed.
 * 
 * @module cli/oracle/combiner/v1
 */
import { zeroAddress, type Address } from "viem";
import type { Client } from "viem";
import { selectAddress } from "../../select";
import { deployCombinerV1Oracle } from "../../../oracle/combiner/v1";
import { logger } from "../../../utils/logger";

/**
 * Deploys a Combiner V1 Oracle through an interactive CLI form
 * 
 * This function:
 * 1. Guides the user through selecting up to four oracle feeds to combine
 * 2. Validates that at least one oracle is selected
 * 3. Deploys the combiner oracle using the selected feeds
 * 
 * @param client - The blockchain client
 * @param oracleFactory - The address of the oracle factory contract
 * @returns The address of the deployed oracle, or false if deployment failed or was cancelled
 */
export async function deployCombinerV1OracleForm(
  client: Client,
  oracleFactory: Address
) {
  const oracles: Address[] = [];
  for (let i = 0; i < 4; i++) {
    const address = await selectAddress(`Select oracle ${i + 1}`, zeroAddress);
    oracles.push(address);
  }
  if (!oracles.some((oracle) => oracle !== zeroAddress)) {
    logger.error("At least one oracle must be selected");
    return false;
  }
  const oracle = await deployCombinerV1Oracle(client, oracleFactory, {
    feed1: oracles[0],
    feed2: oracles[1],
    feed3: oracles[2],
    feed4: oracles[3],
  });
  if (!oracle) {
    logger.error("Failed to deploy oracle");
    return false;
  }
  return oracle;
}
