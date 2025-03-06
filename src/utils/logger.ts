import ora from "ora";
import pino from "pino";
import {
  encodeFunctionData,
  formatEther,
  type Client,
  type Hex,
  type WriteContractParameters,
} from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";
import { FundsState, type Params, type PositionData } from "../vault/position";
import {
  createGeometricDistribution,
  priceFromTick,
  type MarketParams,
} from "@mangrovedao/mgv";
import { rawPriceToHumanPrice } from "@mangrovedao/mgv/lib";
import chalk from "chalk";
import type { FeeData } from "../vault/fee";

// export const logger = pino({
//   transport: {
//     target: "pino-pretty",
//   },
// });

export type TransactionMessages = {
  header?: string;
  label?: string;
  success?: string | ((block: bigint, hash: Hex) => string);
  failure?: string | ((hash: Hex) => string);
};

export const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  trace: console.trace,
  table: console.table,
  handleRequest: async (
    request: WriteContractParameters,
    client: Client,
    messages?: TransactionMessages
  ) => {
    const label = messages?.label ?? "Transaction";
    if (messages?.header) {
      logger.info(messages.header);
    }
    const spinner = ora(`[${label}] Broadcasting transaction...`).start();
    const tx = await writeContract(client, request);
    spinner.text = `[${label}] Waiting for transaction ${tx}...`;
    const receipt = await waitForTransactionReceipt(client, { hash: tx });
    if (receipt.status === "success") {
      spinner.succeed(
        messages?.success
          ? typeof messages.success === "function"
            ? messages.success(receipt.blockNumber, receipt.transactionHash)
            : messages.success
          : `[${label}] Transaction ${tx} confirmed in block ${receipt.blockNumber}: ${receipt.transactionHash}`
      );
    } else {
      spinner.fail(
        messages?.failure
          ? typeof messages.failure === "function"
            ? messages.failure(receipt.transactionHash)
            : messages.failure
          : `[${label}] Transaction ${tx} failed: ${receipt.status}: ${receipt.transactionHash}`
      );
    }
    return receipt;
  },
  logParams: (params: Params) => {
    logger.table({
      "gas price": `${formatEther(BigInt(params.gasprice), "gwei")} Gwei ${
        params.gasprice === 0 ? "(default)" : ""
      }`,
      "gas requirement": `${params.gasreq.toLocaleString("en-US")} gas units`,
      "step size": params.stepSize,
      "price points": params.pricePoints,
    });
  },
  logFundState: (fundsState: FundsState) => {
    const fundStateLabel =
      fundsState === FundsState.Active
        ? "Funds are in the kandel and offers are live"
        : fundsState === FundsState.Passive
        ? "Funds are in the kandel and offers are not live"
        : "Funds are in the vault";
    logger.info(fundStateLabel);
  },
  logPosition: (position: PositionData, market?: MarketParams) => {
    logger.info(chalk.bold("Position details:"));
    logger.logParams(position.params);
    logger.logFundState(position.fundsState);
    const pricePoints: string[] = [];
    if (position.params.pricePoints === 0) {
      logger.info(chalk.red.bold("No price points defined !"));
    } else {
      for (let i = 0; i < position.params.pricePoints; i++) {
        const tick = position.tickIndex0 + position.tickOffset * BigInt(i);
        pricePoints.push(
          market
            ? `${rawPriceToHumanPrice(
                priceFromTick(tick),
                market
              )} (tick: ${tick})`
            : tick.toString()
        );
      }
    }
    const label = market ? "price points" : "ticks";
    logger.table(pricePoints.map((p) => ({ [label]: p })));
  },
  logFees: (fees: FeeData) => {
    logger.info(chalk.bold("Fees:"));
    logger.table({
      "performance fee": `${(fees.performanceFee * 100).toLocaleString(
        undefined,
        { maximumFractionDigits: 4 }
      )}%`,
      "management fee": `${(fees.managementFee * 100).toLocaleString(
        undefined,
        { maximumFractionDigits: 4 }
      )}%`,
      "fee recipient": fees.feeRecipient,
    });
  },
};
