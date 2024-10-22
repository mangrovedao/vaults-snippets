import {
  arbitrumUSDT,
  arbitrumWBTC,
  baseSepoliaDAI,
  baseSepoliaMangrove,
  baseSepoliaWBTC,
} from "@mangrovedao/mgv/addresses";
import { getPrice } from "./oracle/read";
import { arbitrumClient, baseSepoliaClient } from "./utils/client";
import { getCurrentVaultState } from "./vault/read";
import { maxUint128, parseUnits } from "viem";
import { buildOdosSwap } from "./rebalance/odos/build";
import { getOdosQuote } from "./rebalance/odos/quote";
import { addToWhitelist } from "./rebalance/whitelist";
import { ODOS_ARBITRUM } from "./rebalance/odos/addresses";
import { rebalance } from "./rebalance";

// const { tick, price, ...tokens} = await getPrice(
//   baseSepoliaClient,
//   "0x5f47E1E8ee66f6e9E57066Df9cD94f4f05F826Ef",
//   baseSepoliaWBTC.address,
//   baseSepoliaDAI.address
// );

// console.table(tokens);
// console.log(`Price: ${price} Tick: ${tick}`);

// const state = await getCurrentVaultState(
//   baseSepoliaClient,
//   "0x47aE3b288350fE88DDDa224b89Afe324ED9C7419",
//   baseSepoliaMangrove
// );

// console.log(state);
// console.table([...state.kandelState.asks, ...state.kandelState.bids]);
// console.log(state.currentPrice);

const client = arbitrumClient;

const vault = "0x47aE3b288350fE88DDDa224b89Afe324ED9C7419";

await addToWhitelist(client, client.account.address, vault, ODOS_ARBITRUM);

const swap = await getOdosQuote(
  client,
  vault,
  arbitrumWBTC.address,
  arbitrumUSDT.address,
  parseUnits("1", arbitrumWBTC.decimals)
);

console.log(swap);

const build = await buildOdosSwap(vault, swap.pathId);

console.log(build);

await rebalance(client, client.account.address, vault, {
  target: ODOS_ARBITRUM,
  data: build.transaction.data,
  amountOut: swap.amountOut,
  sell: true,
});
