import { formatUnits, type Address, type Client } from "viem";
import type { CurrentVaultState } from "../../vault/read";
import type { OpenOceanRebalanceEntry, RegistryEntry } from "../../registry";
import { getOpenOceanQuote } from "../../rebalance/openocean/quote";
import inquirer from "inquirer";
import { selectNumberWithDecimals } from "../select";
import { logger } from "../../utils/logger";
import ora from "ora";
import { readContract } from "viem/actions";
import { MangroveVaultAbi } from "../../../abis/MangroveVault";
import { addToWhitelist } from "../../rebalance/whitelist";
import { buildOpenOceanSwap } from "../../rebalance/openocean/build";
import { rebalance as rebalanceAction } from "../../rebalance";

async function isWhitelisted(
    client: Client,
    vault: Address,
    address: Address
): Promise<boolean> {
    try {
        const result = await readContract(client, {
            address: vault,
            abi: MangroveVaultAbi,
            functionName: "allowedSwapContracts",
            args: [address],
        });
        return result as boolean;
    } catch (error) {
        logger.error("Error checking whitelist status:", error);
        return false;
    }
}

/**
 * Handles OpenOcean rebalancing for a vault
 * 
 * @param client - Viem client instance
 * @param vault - Vault address
 * @param state - Current vault state
 * @param rebalanceEntry - OpenOcean rebalance configuration
 * @param registry - Registry entry with chain information
 * @param sender - Address of the transaction sender
 * @returns Promise<boolean> - Success status
 */
export async function rebalanceOpenOcean(
    client: Client,
    vault: Address,
    state: CurrentVaultState,
    rebalanceEntry: OpenOceanRebalanceEntry,
    registry: RegistryEntry,
    sender: Address
): Promise<boolean> {
    try {
        logger.info("🌊 Starting OpenOcean rebalance process...");

        // Check if OpenOcean contract is whitelisted
        const openOceanWhitelisted = await isWhitelisted(
            client,
            vault,
            rebalanceEntry.data.contract
        );

        if (!openOceanWhitelisted) {
            logger.warn("OpenOcean contract not whitelisted. Adding to whitelist...");
            const whitelistSpinner = ora("Adding OpenOcean to whitelist...").start();

            try {
                await addToWhitelist(
                    client,
                    sender,
                    vault,
                    rebalanceEntry.data.contract
                );
                whitelistSpinner.succeed("✅ OpenOcean contract whitelisted successfully");
            } catch (error) {
                whitelistSpinner.fail("❌ Failed to whitelist OpenOcean contract");
                throw error;
            }
        }

        // Get user input for rebalance action
        const { action } = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: "Choose rebalance action:",
                choices: [
                    { name: "💰 Sell (sell position token for base token)", value: "sell" },
                    { name: "🛒 Buy (sell base token for position token)", value: "buy" },
                ],
            },
        ]);

        const isSell = action === "sell";
        const sellToken = isSell ? state.market.base : state.market.quote;
        const buyToken = isSell ? state.market.quote : state.market.base;

        logger.info(`Selected action: ${action} ${sellToken.symbol} for ${buyToken.symbol}`);

        // Get amount input from user
        const maxAmount = isSell ? state.vaultBalance.base : state.vaultBalance.quote;
        const maxAmountFormatted = formatUnits(maxAmount, sellToken.decimals);

        if (maxAmount === 0n) {
            logger.error(`❌ No ${sellToken.symbol} balance available for ${action}`);
            return false;
        }

        logger.info(`💰 Available ${sellToken.symbol}: ${maxAmountFormatted}`);

        const amountOut = await selectNumberWithDecimals(
            sellToken.decimals,
            `Enter amount of ${sellToken.symbol} to ${action}`,
            undefined,
            maxAmount
        );

        if (amountOut === 0n) {
            logger.info("❌ Invalid amount entered");
            return false;
        }

        const amountOutFormatted = formatUnits(amountOut, sellToken.decimals);
        logger.info(`🔄 Getting OpenOcean quote for ${amountOutFormatted} ${sellToken.symbol}...`);

        // Get quote from OpenOcean
        const quoteSpinner = ora("Fetching OpenOcean quote...").start();
        let quote;

        try {
            quote = await getOpenOceanQuote(
                client,
                vault,
                sellToken,
                buyToken,
                amountOutFormatted,
                registry.chain.id
            );
            quoteSpinner.succeed("✅ OpenOcean quote received");
        } catch (error) {
            quoteSpinner.fail("❌ Failed to get OpenOcean quote");
            throw error;
        }

        const amountInFormatted = formatUnits(quote.amountOut, buyToken.decimals);
        logger.info(`📊 Quote: ${amountOutFormatted} ${sellToken.symbol} → ${amountInFormatted} ${buyToken.symbol}`);
        logger.info(`💹 Price Impact: ${quote.priceImpact}%`);
        logger.info(`⛽ Gas Estimate: ${quote.gasEstimate.toString()}`);

        // Confirm transaction
        const { confirm } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirm",
                message: "Proceed with this OpenOcean swap?",
                default: false,
            },
        ]);

        if (!confirm) {
            logger.info("❌ Transaction cancelled by user");
            return false;
        }

        // Build swap transaction
        const buildSpinner = ora("Building OpenOcean swap transaction...").start();
        let swapTx;

        try {
            const swapAmountIn = amountOutFormatted;
            const swapAmountOut = amountInFormatted;

            swapTx = await buildOpenOceanSwap(client, vault, {
                route: quote.route,
                sellToken,
                buyToken,
                amountInMax: swapAmountIn,
                amountOutMin: (Number(swapAmountOut) - (Number(swapAmountOut) * 100) / 10000).toString(),// 1% slippage buffer
                sell: isSell,
                gas: 8_000_000n, // Conservative gas limit
            }, registry.chain.id);
            buildSpinner.succeed("✅ OpenOcean swap transaction built");
        } catch (error) {
            buildSpinner.fail("❌ Failed to build OpenOcean swap transaction");
            throw error;
        }

        // Execute rebalance
        const executeSpinner = ora("Executing OpenOcean rebalance...").start();

        try {
            const success = await rebalanceAction(
                client,
                sender,
                vault,
                {
                    target: swapTx.to,
                    data: swapTx.data,
                    amountOut,
                    amountInMin: quote.amountOut - (quote.amountOut * 100n) / 10000n, // 1% slippage tolerance
                    sell: isSell,
                    gas: swapTx.gasLimit,
                }
            );

            if (success) {
                executeSpinner.succeed("✅ OpenOcean rebalance completed successfully!");
                logger.info(`🎉 Successfully ${isSell ? "sold" : "bought"} ${amountOutFormatted} ${sellToken.symbol}`);
                return true;
            } else {
                executeSpinner.fail("❌ OpenOcean rebalance failed");
                return false;
            }
        } catch (error) {
            executeSpinner.fail("❌ OpenOcean rebalance execution failed");
            throw error;
        }

    } catch (error) {
        logger.error("OpenOcean rebalance error:", error);
        return false;
    }
} 