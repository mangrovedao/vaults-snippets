import inquirer from "inquirer";
import { type RegistryEntry } from "../../registry";
import { logger } from "../../utils/logger";
import { setFee, type FeeData } from "../../vault/fee";
import { getCurrentVaultState, type CurrentVaultState } from "../../vault/read";
import { selectAddress } from "../select";
import type { Address, PublicClient, WalletClient, Client } from "viem";
import { FEE_PRECISION } from "../../utils/constants";
import {
  FundsState,
  type PositionData,
  setPosition,
} from "../../vault/position";
import { getKandelPositionRawParams, type MarketParams } from "@mangrovedao/mgv";

async function editFee(
  client: WalletClient,
  vault: Address,
  currentFee: FeeData
) {
  while (true) {
    logger.info(`Editing fee for vault ${vault}`);
    logger.info(`Current fee recipient: ${currentFee.feeRecipient}`);
    logger.info(`Current performance fee: ${currentFee.performanceFee * 100}%`);
    logger.info(`Current management fee: ${currentFee.managementFee * 100}%`);

    const feeRecipient = await selectAddress(
      "Enter the fee recipient",
      currentFee.feeRecipient
    );
    const {
      performanceFee: performanceFeeStr,
      managementFee: managementFeeStr,
    } = await inquirer.prompt([
      {
        type: "input",
        name: "performanceFee",
        message: "Enter the performance fee",
        default: currentFee.performanceFee.toString(),
        validate: (value: string) => {
          const parsed = parseFloat(value);
          if (isNaN(parsed)) {
            return "Please enter a valid number";
          }
          if (parsed < 0 || parsed > 1) {
            return "Fee must be between 0 and 1";
          }
          // Check if the value multiplied by FEE_PRECISION is an integer
          const scaled = parsed * FEE_PRECISION;
          if (Math.floor(scaled) !== scaled) {
            return `Please enter a value that is a multiple of ${
              1 / FEE_PRECISION
            }`;
          }
          return true;
        },
      },
      {
        type: "input",
        name: "managementFee",
        message: "Enter the management fee",
        default: currentFee.managementFee.toString(),
        validate: (value: string) => {
          const parsed = parseFloat(value);
          if (isNaN(parsed)) {
            return "Please enter a valid number";
          }
          if (parsed < 0 || parsed > 1) {
            return "Fee must be between 0 and 1";
          }
          // Check if the value multiplied by FEE_PRECISION is an integer
          const scaled = parsed * FEE_PRECISION;
          if (Math.floor(scaled) !== scaled) {
            return `Please enter a value that is a multiple of ${
              1 / FEE_PRECISION
            }`;
          }
          return true;
        },
      },
    ]);

    const performanceFee = parseFloat(performanceFeeStr);
    const managementFee = parseFloat(managementFeeStr);

    const newFeeData: FeeData = {
      feeRecipient,
      performanceFee:
        Math.floor(performanceFee * FEE_PRECISION) / FEE_PRECISION,
      managementFee: Math.floor(managementFee * FEE_PRECISION) / FEE_PRECISION,
    };

    logger.info("The new fee data will be:");
    logger.info(`Fee recipient: ${newFeeData.feeRecipient}`);
    logger.info(`Performance fee: ${newFeeData.performanceFee * 100}%`);
    logger.info(`Management fee: ${newFeeData.managementFee * 100}%`);

    const confirmation = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Are you sure you want to update the fee?",
        default: false,
      },
    ]);

    if (!confirmation.confirm) {
      continue;
    }

    const success = await setFee(client, vault, newFeeData);
    if (success) {
      break;
    } else {
      logger.error("Failed to update the fee. Please try again.");
    }
  }
}

async function editPosition(
  client: WalletClient,
  vault: Address,
  currentPosition: PositionData
) {
  while (true) {
    logger.info(`Editing position for vault ${vault}`);
    logger.info(`Current tick index 0: ${currentPosition.tickIndex0}`);
    logger.info(`Current tick offset: ${currentPosition.tickOffset}`);
    logger.info(
      `Current funds state: ${getFundsStateString(currentPosition.fundsState)}`
    );
    logger.info(`Current params:`);
    logger.info(`  Gas price: ${currentPosition.params.gasprice}`);
    logger.info(`  Gas required: ${currentPosition.params.gasreq}`);
    logger.info(`  Step size: ${currentPosition.params.stepSize}`);
    logger.info(`  Price points: ${currentPosition.params.pricePoints}`);

    const { tickIndex0Str, tickOffsetStr } = await inquirer.prompt([
      {
        type: "input",
        name: "tickIndex0Str",
        message: "Enter the tick index 0",
        default: currentPosition.tickIndex0.toString(),
        validate: (value: string) => {
          try {
            BigInt(value);
            return true;
          } catch (e) {
            return "Please enter a valid bigint";
          }
        },
      },
      {
        type: "input",
        name: "tickOffsetStr",
        message: "Enter the tick offset",
        default: currentPosition.tickOffset.toString(),
        validate: (value: string) => {
          try {
            BigInt(value);
            return true;
          } catch (e) {
            return "Please enter a valid bigint";
          }
        },
      },
    ]);

    const { gasprice, gasreq, stepSize, pricePoints } = await inquirer.prompt([
      {
        type: "input",
        name: "gasprice",
        message: "Enter the gas price",
        default: currentPosition.params.gasprice.toString(),
        validate: (value: string) => {
          const num = Number(value);
          return !isNaN(num) && Number.isInteger(num) && num >= 0
            ? true
            : "Please enter a valid non-negative integer";
        },
      },
      {
        type: "input",
        name: "gasreq",
        message: "Enter the gas required",
        default: currentPosition.params.gasreq.toString(),
        validate: (value: string) => {
          const num = Number(value);
          return !isNaN(num) && Number.isInteger(num) && num >= 0
            ? true
            : "Please enter a valid non-negative integer";
        },
      },
      {
        type: "input",
        name: "stepSize",
        message: "Enter the step size",
        default: currentPosition.params.stepSize.toString(),
        validate: (value: string) => {
          const num = Number(value);
          return !isNaN(num) && Number.isInteger(num) && num >= 0
            ? true
            : "Please enter a valid non-negative integer";
        },
      },
      {
        type: "input",
        name: "pricePoints",
        message: "Enter the price points",
        default: currentPosition.params.pricePoints.toString(),
        validate: (value: string) => {
          const num = Number(value);
          return !isNaN(num) && Number.isInteger(num) && num >= 0
            ? true
            : "Please enter a valid non-negative integer";
        },
      },
    ]);

    const fundsStateChoices = [
      { name: getFundsStateString(FundsState.Vault), value: FundsState.Vault },
      {
        name: getFundsStateString(FundsState.Passive),
        value: FundsState.Passive,
      },
      {
        name: getFundsStateString(FundsState.Active),
        value: FundsState.Active,
      },
    ];

    const { fundsState } = await inquirer.prompt([
      {
        type: "list",
        name: "fundsState",
        message: "Select the funds state",
        choices: fundsStateChoices,
        default: currentPosition.fundsState,
      },
    ]);

    const newPosition: PositionData = {
      tickIndex0: BigInt(tickIndex0Str),
      tickOffset: BigInt(tickOffsetStr),
      params: {
        gasprice: Number(gasprice),
        gasreq: Number(gasreq),
        stepSize: Number(stepSize),
        pricePoints: Number(pricePoints),
      },
      fundsState,
    };

    // Display the new position values before confirming
    logger.info("New position values:");
    logger.info(`Tick index 0: ${newPosition.tickIndex0}`);
    logger.info(`Tick offset: ${newPosition.tickOffset}`);
    logger.info(`Funds state: ${getFundsStateString(newPosition.fundsState)}`);
    logger.info(`Params:`);
    logger.info(`  Gas price: ${newPosition.params.gasprice}`);
    logger.info(`  Gas required: ${newPosition.params.gasreq}`);
    logger.info(`  Step size: ${newPosition.params.stepSize}`);
    logger.info(`  Price points: ${newPosition.params.pricePoints}`);

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Do you want to update the position?",
        default: false,
      },
    ]);

    if (confirm) {
      try {
        await setPosition(client, vault, newPosition);
        logger.info("Position updated successfully");
        return;
      } catch (e) {
        logger.error(`Failed to update position: ${e}`);
      }
    } else {
      const { retry } = await inquirer.prompt([
        {
          type: "confirm",
          name: "retry",
          message: "Do you want to try again?",
          default: true,
        },
      ]);
      if (!retry) {
        return;
      }
    }
  }
}

async function editPriceRange(
  client: WalletClient,
  vault: Address,
  state: CurrentVaultState
) {
  const { currentPrice } = state;
  logger.info(`Current price: ${currentPrice}`);

  while (true) {
    const { pricePoints, minPrice, maxPrice } = await inquirer.prompt([
      {
        type: "input",
        name: "pricePoints",
        message: "Enter the number of price points (positive integer):",
        default: state.position.params.pricePoints.toString(),
        validate: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
            return "Please enter a positive integer";
          }
          return true;
        },
        filter: (value) => BigInt(value),
      },
      {
        type: "input",
        name: "minPrice",
        message: "Enter the minimum price (positive decimal):",
        validate: (value) => {
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) {
            return "Please enter a positive decimal number";
          }
          return true;
        },
        filter: (value) => parseFloat(value),
      },
      {
        type: "input",
        name: "maxPrice",
        message: "Enter the maximum price (positive decimal):",
        validate: (value) => {
          const num = parseFloat(value);
          if (isNaN(num) || num <= 0) {
            return "Please enter a positive decimal number";
          }
          return true;
        },
        filter: (value) => parseFloat(value),
      },
    ]);

    const { baseQuoteTickIndex0, baseQuoteTickOffset } = getKandelPositionRawParams({
      minPrice,
      maxPrice,
      midPrice: currentPrice,
      pricePoints,
      market: state.market,
    });

    const newPosition: PositionData = {
      tickIndex0: baseQuoteTickIndex0,
      tickOffset: baseQuoteTickOffset,
      params: {
        gasprice: state.position.params.gasprice,
        gasreq: state.position.params.gasreq,
        stepSize: state.position.params.stepSize,
        pricePoints: Number(pricePoints),
      },
      fundsState: state.position.fundsState,
    };

    logger.info("New position values:");
    logger.info(`Tick index 0: ${newPosition.tickIndex0}`);
    logger.info(`Tick offset: ${newPosition.tickOffset}`);
    logger.info(`Funds state: ${getFundsStateString(newPosition.fundsState)}`);
    logger.info(`Params:`);
    logger.info(`  Gas price: ${newPosition.params.gasprice}`);
    logger.info(`  Gas required: ${newPosition.params.gasreq}`);
    logger.info(`  Step size: ${newPosition.params.stepSize}`);
    logger.info(`  Price points: ${newPosition.params.pricePoints}`);

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Do you want to update the position?",
        default: false,
      },
    ]);

    if (confirm) {
      try {
        await setPosition(client, vault, newPosition);
        logger.info("Position updated successfully");
        return;
      } catch (e) {
        logger.error(`Failed to update position: ${e}`);
      }
    } else {
      const { retry } = await inquirer.prompt([
        {
          type: "confirm",
          name: "retry",
          message: "Do you want to try again?",
          default: true,
        },
      ]);
      if (!retry) {
        return;
      }
    }
  }
}
// Helper function to convert FundsState enum to readable string
function getFundsStateString(fundsState: FundsState): string {
  switch (fundsState) {
    case FundsState.Vault:
      return "Vault (funds will stay in vault)";
    case FundsState.Passive:
      return "Passive (funds will be on the kandel contract with no active position)";
    case FundsState.Active:
      return "Active (funds will be on the kandel contract with an active position)";
  }
}

export async function editVault(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry
) {
  const vault = await selectAddress("Enter the vault address");

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What do you want to edit?",
      choices: [
        { name: "Fee", value: "fee" },
        { name: "Position", value: "position" },
        { name: "Price range", value: "priceRange" },
        { name: "Cancel", value: "cancel" },
      ],
    },
  ]);

  if (action === "cancel") {
    return;
  }

  const vaultState = await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );

  logger.info(
    `Vault market: ${vaultState.market.base.symbol}/${vaultState.market.quote.symbol}`
  );

  if (action === "fee") {
    await editFee(walletClient, vault, vaultState.feeData);
  } else if (action === "position") {
    await editPosition(walletClient, vault, vaultState.position);
  } else if (action === "priceRange") {
    await editPriceRange(walletClient, vault, vaultState);
  }
}
