import { zeroAddress, type Address } from "viem";
import type { Client } from "viem";
import { selectAddress } from "../../select";
import { deployCombinerV1Oracle } from "../../../oracle/combiner/v1";
import { logger } from "../../../utils/logger";

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
