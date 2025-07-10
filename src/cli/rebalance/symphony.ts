import { formatUnits, type Address, type Client } from "viem";
import type { CurrentVaultState } from "../../vault/read";
import type { SymphonyRebalanceEntry, RegistryEntry } from "../../registry";
import { getSymphonyQuote } from "../../rebalance/symphony/quote";
import inquirer from "inquirer";
import { selectNumberWithDecimals } from "../select";
import { logger } from "../../utils/logger";
import ora from "ora";
import { readContract } from "viem/actions";
import { MangroveVaultAbi } from "../../../abis/MangroveVault";
import { addToWhitelist } from "../../rebalance/whitelist";
import { buildSymphonySwap } from "../../rebalance/symphony/build";
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
 * Handles Symphony rebalancing for a vault
 * 
 * @param client - Viem client instance
 * @param vault - Vault address
 * @param state - Current vault state
 * @param rebalanceEntry - Symphony rebalance configuration
 * @param registry - Registry entry with chain information
 * @param sender - Address of the transaction sender
 * @returns Promise<boolean> - Success status
 */
export async function rebalanceSymphony(
    client: Client,
    vault: Address,
    state: CurrentVaultState,
    rebalanceEntry: SymphonyRebalanceEntry,
    registry: RegistryEntry,
    sender: Address
): Promise<boolean> {
    try {
        logger.info("🎵 Starting Symphony rebalance process...");

        // Check if Symphony contract is whitelisted
        const symphonyWhitelisted = await isWhitelisted(
            client,
            vault,
            rebalanceEntry.data.contract
        );

        if (!symphonyWhitelisted) {
            logger.warn("Symphony contract not whitelisted. Adding to whitelist...");
            const whitelistSpinner = ora("Adding Symphony to whitelist...").start();

            try {
                await addToWhitelist(
                    client,
                    sender,
                    vault,
                    rebalanceEntry.data.contract
                );
                whitelistSpinner.succeed("✅ Symphony contract whitelisted successfully");
            } catch (error) {
                whitelistSpinner.fail("❌ Failed to whitelist Symphony contract");
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
        logger.info(`🔄 Getting Symphony quote for ${amountOutFormatted} ${sellToken.symbol}...`);

        // Get quote from Symphony
        const quoteSpinner = ora("Fetching Symphony quote...").start();
        let quote;

        try {
            quote = await getSymphonyQuote(
                client,
                vault,
                sellToken,
                buyToken,
                amountOut,
                registry.chain.id
            );
            quoteSpinner.succeed("✅ Symphony quote received");
        } catch (error) {
            quoteSpinner.fail("❌ Failed to get Symphony quote");
            throw error;
        }

        const amountInFormatted = formatUnits(quote.amountOut, buyToken.decimals);
        logger.info(`📊 Quote: ${amountOutFormatted} ${sellToken.symbol} → ${amountInFormatted} ${buyToken.symbol}`);
        logger.info(`💹 Price Impact: ${quote.priceImpact}`);
        logger.info(`⛽ Gas Estimate: ${quote.gasEstimate.toString()}`);

        // Confirm transaction
        const { confirm } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirm",
                message: "Proceed with this Symphony swap?",
                default: false,
            },
        ]);

        if (!confirm) {
            logger.info("❌ Transaction cancelled by user");
            return false;
        }

        // Build swap transaction
        const buildSpinner = ora("Building Symphony swap transaction...").start();
        let swapTx;

        try {
            swapTx = await buildSymphonySwap(client, vault, {
                route: quote.route,
                sellToken,
                buyToken,
                amountInMax: quote.amountOut + (quote.amountOut * 100n) / 10000n, // 1% slippage buffer
                amountOutMin: amountOut,
                sell: isSell,
                gas: 8_000_000n, // Conservative gas limit
            });
            buildSpinner.succeed("✅ Symphony swap transaction built");
        } catch (error) {
            buildSpinner.fail("❌ Failed to build Symphony swap transaction");
            throw error;
        }

        // Execute rebalance
        const executeSpinner = ora("Executing Symphony rebalance...").start();

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
                executeSpinner.succeed("✅ Symphony rebalance completed successfully!");
                logger.info(`🎉 Successfully ${isSell ? "sold" : "bought"} ${amountOutFormatted} ${sellToken.symbol}`);
                return true;
            } else {
                executeSpinner.fail("❌ Symphony rebalance failed");
                return false;
            }
        } catch (error) {
            executeSpinner.fail("❌ Symphony rebalance execution failed");
            throw error;
        }

    } catch (error) {
        logger.error("Symphony rebalance error:", error);
        return false;
    }
} 