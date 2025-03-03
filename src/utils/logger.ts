import ora from "ora";
import pino from "pino";
import type { Client, Hex, WriteContractParameters } from "viem";
import { waitForTransactionReceipt, writeContract } from "viem/actions";

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
};
