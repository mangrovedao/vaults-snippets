import { formatUnits, type Address, type Client } from "viem";
import type { CurrentVaultState } from "../../vault/read";
import type { KameRebalanceEntry, RegistryEntry } from "../../registry";
import { getKameQuote } from "../../rebalance/kame/quote";
import inquirer from "inquirer";
import { selectNumberWithDecimals } from "../select";
import { logger } from "../../utils/logger";
import ora from "ora";
import { readContract } from "viem/actions";
import { MangroveVaultAbi } from "../../../abis/MangroveVault";
import { addToWhitelist } from "../../rebalance/whitelist";
import { buildKameSwap } from "../../rebalance/kame/build";
import { rebalance as rebalanceAction } from "../../rebalance";

async function isWhitelisted(
    client: Client,
    vault: Address,
    contract: Address
) {
    const isWhitelisted = await readContract(client, {
        address: vault,
        abi: MangroveVaultAbi,
        functionName: "allowedSwapContracts",
        args: [contract],
    });
    return isWhitelisted;
}

export async function whitelistIfNeeded(
    client: Client,
    vault: Address,
    contract: Address,
    sender: Address
) {
    const spinner = ora(
        `Checking if contract ${contract} is whitelisted for vault ${vault}...`
    ).start();
    const whitelisted = await isWhitelisted(client, vault, contract);
    spinner.succeed(
        `Contract ${contract} is ${whitelisted ? "whitelisted" : "not whitelisted"
        } for vault ${vault}`
    );
    if (!whitelisted) {
        const { confirmWhitelist } = await inquirer.prompt([
            {
                type: "confirm",
                name: "confirmWhitelist",
                message: `Do you want to whitelist contract ${contract} for vault ${vault}?`,
                default: true,
            },
        ]);

        if (confirmWhitelist) {
            try {
                // Add the contract to the whitelist
                const success = await addToWhitelist(client, sender, vault, contract);
                return success;
            } catch (error) {
                logger.error(`Error whitelisting contract: `);
                logger.error(error);
                return false;
            }
        } else {
            return false;
        }
    }

    return true;
}

export async function rebalanceKame(
    client: Client,
    vault: Address,
    vaultState: CurrentVaultState,
    rebalance: KameRebalanceEntry,
    registry: RegistryEntry,
    sender: Address
) {
    // Display current vault balances
    logger.info("Current Vault Balances:");
    logger.info(
        `${vaultState.market.base.symbol}: ${formatUnits(
            vaultState.kandelBalance.base + vaultState.vaultBalance.base,
            vaultState.market.base.decimals
        )}`
    );
    logger.info(
        `${vaultState.market.quote.symbol}: ${formatUnits(
            vaultState.kandelBalance.quote + vaultState.vaultBalance.quote,
            vaultState.market.quote.decimals
        )}`
    );
    logger.info("----------------------------");

    const whitelisted = await whitelistIfNeeded(
        client,
        vault,
        rebalance.data.contract,
        sender
    );
    if (!whitelisted) {
        return false;
    }

    // Ask user if they want to buy or sell
    const { action } = (await inquirer.prompt([
        {
            type: "list",
            name: "action",
            message: `Do you want to buy or sell? (${vaultState.market.base.symbol}/${vaultState.market.quote.symbol})`,
            choices: [
                {
                    name: `Buy ${vaultState.market.base.symbol} with ${vaultState.market.quote.symbol}`,
                    value: "buy",
                },
                {
                    name: `Sell ${vaultState.market.base.symbol} for ${vaultState.market.quote.symbol}`,
                    value: "sell",
                },
            ],
        },
    ])) as { action: "buy" | "sell" };

    const sellToken =
        action === "buy" ? vaultState.market.quote : vaultState.market.base;
    const buyToken =
        action === "buy" ? vaultState.market.base : vaultState.market.quote;

    const amountOut = await selectNumberWithDecimals(
        sellToken.decimals,
        `Enter the amount of ${sellToken.symbol} to sell`,
        undefined,
        action === "buy"
            ? vaultState.vaultBalance.quote
            : vaultState.vaultBalance.base
    );

    const spinner = ora(`Getting quote on Kame...`).start();
    const quote = await getKameQuote(
        client,
        vault,
        sellToken,
        buyToken,
        amountOut,
        registry.chain.id
    );
    const formattedAmountIn = formatUnits(quote.amountIn, buyToken.decimals);
    const formattedAmountOut = formatUnits(quote.amountOut, sellToken.decimals);
    spinner.succeed(
        `Quote: ${formattedAmountIn} ${buyToken.symbol} for ${formattedAmountOut} ${sellToken.symbol
        }; price: ${(action === "buy"
            ? Number(formattedAmountOut) / Number(formattedAmountIn)
            : Number(formattedAmountIn) / Number(formattedAmountOut)
        ).toLocaleString("en-US", {
            maximumFractionDigits: 6,
        })}`
    );

    const { confirmRebalance } = (await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmRebalance",
            message: `Do you want to rebalance?`,
        },
    ])) as { confirmRebalance: boolean };

    if (!confirmRebalance) {
        return false;
    }

    const spinner2 = ora(`Building transaction...`).start();
    const built = await buildKameSwap(
        vault,
        sellToken.address,
        buyToken.address,
        amountOut,
        registry.chain.id
    );
    spinner2.succeed(`Transaction built`);

    const amountInMin = await selectNumberWithDecimals(
        buyToken.decimals,
        `Enter the minimum amount of ${buyToken.symbol} to buy`,
        undefined
    );

    const success = await rebalanceAction(client, sender, vault, {
        target: built.transaction.to,
        data: built.transaction.data,
        amountOut: BigInt(quote.amountOut),
        amountInMin,
        sell: action === "sell",
        gas: 10_000_000n,
    });

    return success;
} 