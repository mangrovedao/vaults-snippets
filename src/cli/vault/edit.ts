/**
 * Vault Editing Module
 *
 * This module provides functionality for editing vault parameters through an interactive CLI.
 * It allows users to modify fee structures, position parameters, and price ranges for vaults.
 */
import inquirer from "inquirer";
import { type RegistryEntry } from "../../registry";
import { logger } from "../../utils/logger";
import { setFee, type FeeData } from "../../vault/fee";
import { getCurrentVaultState, type CurrentVaultState } from "../../vault/read";
import {
  selectAddress,
  selectFromEnum,
  selectVault,
  type SavedVault,
} from "../select";
import {
  type Address,
  type PublicClient,
  type WalletClient,
  isAddressEqual,
} from "viem";
import { FEE_PRECISION } from "../../utils/constants";
import {
  FundsState,
  type PositionData,
  setPosition,
} from "../../vault/position";
import { getKandelPositionRawParams } from "@mangrovedao/mgv";
import { setManager, setOwner } from "../../vault/owner";

/**
 * Guides the user through editing fee parameters for a vault
 *
 * This function:
 * 1. Displays current fee configuration
 * 2. Prompts for new fee recipient and fee percentages
 * 3. Validates inputs and confirms changes before submission
 *
 * @param client - The wallet client for signing transactions
 * @param vault - The address of the vault to edit
 * @param currentFee - The current fee configuration of the vault
 */
export async function editFee(
  client: WalletClient,
  vault: SavedVault,
  currentFee: FeeData
) {
  while (true) {
    logger.info(`Editing fee for vault ${vault}`);
    logger.info(`Current fee recipient: ${currentFee.feeRecipient}`);
    logger.info(`Current performance fee: ${currentFee.performanceFee * 100}%`);
    logger.info(`Current management fee: ${currentFee.managementFee * 100}%`);

    // Prompt for new fee recipient
    const feeRecipient = await selectAddress(
      "Enter the fee recipient",
      currentFee.feeRecipient
    );

    // Prompt for new fee percentages
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

    // Parse and normalize fee values
    const performanceFee = parseFloat(performanceFeeStr);
    const managementFee = parseFloat(managementFeeStr);

    const newFeeData: FeeData = {
      feeRecipient,
      performanceFee:
        Math.floor(performanceFee * FEE_PRECISION) / FEE_PRECISION,
      managementFee: Math.floor(managementFee * FEE_PRECISION) / FEE_PRECISION,
    };

    // Display new fee configuration for confirmation
    logger.info("The new fee data will be:");
    logger.info(`Fee recipient: ${newFeeData.feeRecipient}`);
    logger.info(`Performance fee: ${newFeeData.performanceFee * 100}%`);
    logger.info(`Management fee: ${newFeeData.managementFee * 100}%`);

    // Confirm changes before submission
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

    // Submit fee changes to the blockchain
    const success = await setFee(client, vault.address, newFeeData);
    if (success) {
      break;
    } else {
      logger.error("Failed to update the fee. Please try again.");
    }
  }
}

/**
 * Guides the user through editing position parameters for a vault
 *
 * This function:
 * 1. Displays current position configuration
 * 2. Prompts for new tick indices, gas parameters, and funds state
 * 3. Validates inputs and confirms changes before submission
 *
 * @param client - The wallet client for signing transactions
 * @param vault - The address of the vault to edit
 * @param currentPosition - The current position configuration of the vault
 */
export async function editPosition(
  client: WalletClient,
  vault: SavedVault,
  currentPosition: PositionData
) {
  while (true) {
    // Display current position configuration
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

    // Prompt for new tick indices
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

    // Prompt for new gas and position parameters
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

    // Define funds state options
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

    // Prompt for new funds state
    const { fundsState } = await inquirer.prompt([
      {
        type: "list",
        name: "fundsState",
        message: "Select the funds state",
        choices: fundsStateChoices,
        default: currentPosition.fundsState,
      },
    ]);

    // Construct new position data
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

    // Display new position configuration for confirmation
    logger.info("New position values:");
    logger.info(`Tick index 0: ${newPosition.tickIndex0}`);
    logger.info(`Tick offset: ${newPosition.tickOffset}`);
    logger.info(`Funds state: ${getFundsStateString(newPosition.fundsState)}`);
    logger.info(`Params:`);
    logger.info(`  Gas price: ${newPosition.params.gasprice}`);
    logger.info(`  Gas required: ${newPosition.params.gasreq}`);
    logger.info(`  Step size: ${newPosition.params.stepSize}`);
    logger.info(`  Price points: ${newPosition.params.pricePoints}`);

    // Confirm changes before submission
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
        // Submit position changes to the blockchain
        await setPosition(client, vault.address, newPosition);
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

/**
 * Guides the user through editing price range parameters for a vault
 *
 * This function:
 * 1. Displays current price
 * 2. Prompts for new price points, minimum price, and maximum price
 * 3. Calculates appropriate tick parameters based on price inputs
 * 4. Confirms changes before submission
 *
 * @param client - The wallet client for signing transactions
 * @param vault - The address of the vault to edit
 * @param state - The current state of the vault including price information
 */
export async function editPriceRange(
  client: WalletClient,
  vault: SavedVault,
  state: CurrentVaultState
) {
  const { currentPrice } = state;
  logger.info(`Current price: ${currentPrice}`);

  while (true) {
    // Prompt for new price range parameters
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

    // Calculate tick parameters based on price inputs
    const { baseQuoteTickIndex0, baseQuoteTickOffset } =
      getKandelPositionRawParams({
        minPrice,
        maxPrice,
        midPrice: currentPrice,
        pricePoints,
        market: state.market,
      });

    // Define funds state options
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

    // Prompt for new funds state
    const { fundsState } = await inquirer.prompt([
      {
        type: "list",
        name: "fundsState",
        message: "Select the funds state",
        choices: fundsStateChoices,
        default: state.position.fundsState,
      },
    ]);

    // Construct new position data
    const newPosition: PositionData = {
      tickIndex0: baseQuoteTickIndex0,
      tickOffset: baseQuoteTickOffset,
      params: {
        gasprice: state.position.params.gasprice,
        gasreq: state.position.params.gasreq,
        stepSize: 1,
        pricePoints: Number(pricePoints),
      },
      fundsState,
    };

    // Display new position configuration for confirmation
    logger.info("New position values:");
    logger.info(`Tick index 0: ${newPosition.tickIndex0}`);
    logger.info(`Tick offset: ${newPosition.tickOffset}`);
    logger.info(`Funds state: ${getFundsStateString(newPosition.fundsState)}`);
    logger.info(`Params:`);
    logger.info(`  Gas price: ${newPosition.params.gasprice}`);
    logger.info(`  Gas required: ${newPosition.params.gasreq}`);
    logger.info(`  Step size: ${newPosition.params.stepSize}`);
    logger.info(`  Price points: ${newPosition.params.pricePoints}`);

    // Confirm changes before submission
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
        // Submit position changes to the blockchain
        await setPosition(client, vault.address, newPosition);
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

/**
 * Converts FundsState enum values to human-readable strings
 *
 * @param fundsState - The funds state enum value
 * @returns A descriptive string representing the funds state
 */
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

async function editOwner(
  client: WalletClient,
  vault: SavedVault,
  currentOwner: Address
) {
  const newOwner = await selectAddress("Enter the new owner", currentOwner);
  if (isAddressEqual(currentOwner, newOwner)) {
    logger.info("New owner is the same as the current owner");
    return;
  }
  await setOwner(client, vault.address, newOwner);
}

async function editManager(
  client: WalletClient,
  vault: SavedVault,
  currentManager: Address
) {
  const newManager = await selectAddress(
    "Enter the new manager",
    currentManager
  );
  if (isAddressEqual(currentManager, newManager)) {
    logger.info("New manager is the same as the current manager");
    return;
  }
  await setManager(client, vault.address, newManager);
}

enum EditAction {
  Fee = "fee",
  Position = "position",
  PriceRange = "priceRange",
  Owner = "owner",
  Manager = "manager",
  Cancel = "cancel",
}

/**
 * Main function for editing vault parameters through the CLI
 *
 * This function:
 * 1. Prompts the user to select a vault
 * 2. Offers options to edit fees, position parameters, or price range
 * 3. Routes to the appropriate editing function based on user selection
 *
 * @param publicClient - The public blockchain client for reading data
 * @param walletClient - The wallet client for signing transactions
 * @param registry - The registry entry containing contract addresses and chain information
 */
export async function editVault(
  publicClient: PublicClient,
  walletClient: WalletClient,
  registry: RegistryEntry
) {
  // Select the vault to edit
  const vault = await selectVault(publicClient, registry.chain.id);
  if (!vault) {
    logger.error("No vault selected");
    return;
  }

  const action = await selectFromEnum("What do you want to edit?", EditAction);

  if (action === EditAction.Cancel) {
    return;
  }

  // Fetch current vault state
  const vaultState = await getCurrentVaultState(
    publicClient,
    vault,
    registry.mangrove
  );

  logger.info(
    `Vault market: ${vaultState.market.base.symbol}/${vaultState.market.quote.symbol}`
  );

  // Route to the appropriate editing function
  if (action === EditAction.Fee) {
    await editFee(walletClient, vault, vaultState.feeData);
  } else if (action === EditAction.Position) {
    await editPosition(walletClient, vault, vaultState.position);
  } else if (action === EditAction.PriceRange) {
    await editPriceRange(walletClient, vault, vaultState);
  } else if (action === EditAction.Owner) {
    await editOwner(walletClient, vault, vaultState.owner);
  } else if (action === EditAction.Manager) {
    await editManager(walletClient, vault, vaultState.manager);
  }
}
