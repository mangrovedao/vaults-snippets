/**
 * Logger Utility Module
 * 
 * This module provides logging functionality for the CLI application,
 * including transaction handling, data formatting, and console output utilities.
 * 
 * @module utils/logger
 */
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

/**
 * Configuration for transaction messages
 * 
 * @property header - Optional message to display before the transaction is sent
 * @property label - Optional label for the transaction (default: "Transaction")
 * @property success - Optional message or function to generate a message on success
 * @property failure - Optional message or function to generate a message on failure
 */
export type TransactionMessages = {
  header?: string;
  label?: string;
  success?: string | ((block: bigint, hash: Hex) => string);
  failure?: string | ((hash: Hex) => string);
};

/**
 * Logger object providing various logging and transaction handling utilities
 */
export const logger = {
  /**
   * Logs informational messages
   */
  info: console.log,
  
  /**
   * Logs error messages
   */
  error: console.error,
  
  /**
   * Logs warning messages
   */
  warn: console.warn,
  
  /**
   * Logs debug messages
   */
  debug: console.debug,
  
  /**
   * Logs stack traces
   */
  trace: console.trace,
  
  /**
   * Logs data in tabular format
   */
  table: console.table,
  
  /**
   * Handles blockchain transaction requests with visual feedback
   * 
   * Displays a spinner while the transaction is pending and appropriate
   * success or failure messages once the transaction is confirmed.
   * 
   * @param request - The transaction request parameters
   * @param client - The blockchain client
   * @param messages - Optional configuration for transaction messages
   * @returns The transaction receipt
   */
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
  
  /**
   * Logs vault position parameters in a formatted table
   * 
   * @param params - The position parameters to log
   */
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
  
  /**
   * Logs the funds state of a vault position
   * 
   * @param fundsState - The funds state to log
   */
  logFundState: (fundsState: FundsState) => {
    const fundStateLabel =
      fundsState === FundsState.Active
        ? "Funds are in the kandel and offers are live"
        : fundsState === FundsState.Passive
        ? "Funds are in the kandel and offers are not live"
        : "Funds are in the vault";
    logger.info(fundStateLabel);
  },
  
  /**
   * Logs detailed information about a vault position
   * 
   * @param position - The position data to log
   * @param market - Optional market parameters for price formatting
   */
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
  
  /**
   * Logs fee information for a vault
   * 
   * @param fees - The fee data to log
   */
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
