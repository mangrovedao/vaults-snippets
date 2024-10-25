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
import { maxUint128, parseEther, parseUnits } from "viem";
import { buildOdosSwap } from "./rebalance/odos/build";
import { getOdosQuote } from "./rebalance/odos/quote";
import { addToWhitelist } from "./rebalance/whitelist";
import { ODOS_ARBITRUM } from "./rebalance/odos/addresses";
import { rebalance } from "./rebalance";
import {
  getKandelPositionRawParams,
  inboundFromOutbound,
  validateKandelParams,
} from "@mangrovedao/mgv/lib";
import { deployOracle } from "./oracle/factory";
import { deployVault } from "./vault/factory";
import { logger } from "./utils/logger";
import { setFee } from "./vault/fee";
import { FundsState, setPosition } from "./vault/position";
const MANGROVE_CHAINLINK_ORACLE_FACTORY_ADDRESS =
  "0xC6488ED14C0AD6763eC56d8e81F1bDE5016772dD";
const MANGROVE_VAULT_FACTORY_ADDRESS =
  "0x751A2128aDA840049D0Cc1C4B7F8cF7311F568Fd";
const GEOMETRIC_KANDEL_EXTRA_ADDRESS =
  "0x52183120c98800bBd18847255D92b91f6400e440";

const WBTC_USD_FEED = "0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298";
const DAI_USD_FEED = "0xD1092a65338d049DB68D7Be6bD89d17a0929945e";

logger.info(baseSepoliaClient.account.address, "deployer");

// const oracle = await deployOracle(
//   baseSepoliaClient,
//   MANGROVE_CHAINLINK_ORACLE_FACTORY_ADDRESS,
//   baseSepoliaClient.account.address,
//   {
//     baseFeed1: { feed: WBTC_USD_FEED, baseDecimals: 8n, quoteDecimals: 18n },
//     quoteFeed1: { feed: DAI_USD_FEED, baseDecimals: 18n, quoteDecimals: 18n },
//   }
// );

// if (!oracle) {
//   throw new Error("Failed to deploy oracle");
// }

const oracle = "0x9B4d385f99aF02c3D2624a7B461d6843079b7819";

const KANDEL_SEEDER = "0x1A839030107167452D69d8f1a673004B2a1b8A3A";

// const vault = await deployVault(
//   baseSepoliaClient,
//   MANGROVE_VAULT_FACTORY_ADDRESS,
//   baseSepoliaClient.account.address,
//   {
//     seeder: KANDEL_SEEDER,
//     base: baseSepoliaWBTC.address,
//     quote: baseSepoliaDAI.address,
//     tickSpacing: 1n,
//     oracle,
//     symbol: "maxWBTCDAI-2",
//     name: "Maxence WBTCDAI v2",
//   }
// );

const vault = "0xae68E2f084bC5B72Dbb5Dc5bD75AF8879eDb5CBC";

const { tick, price, market } = await getPrice(
  baseSepoliaClient,
  oracle,
  baseSepoliaWBTC.address,
  baseSepoliaDAI.address
);

const { baseQuoteTickIndex0, baseQuoteTickOffset } = getKandelPositionRawParams(
  {
    minPrice: price - 10000,
    maxPrice: price + 10000,
    midPrice: price,
    pricePoints: 11n,
    market,
  }
);

// const result = await setFee(baseSepoliaClient, vault, {
//   feeRecipient: baseSepoliaClient.account.address,
//   performanceFee: 0.15, // 15%
//   managementFee: 0.015, // 1.5%
// });

// logger.info(result);

const result = await setPosition(
  baseSepoliaClient,
  vault,
  baseSepoliaClient.account.address,
  {
    tickIndex0: baseQuoteTickIndex0,
    tickOffset: baseQuoteTickOffset,
    params: {
      pricePoints: 11,
      stepSize: 1,
      gasreq: 0,
      gasprice: 0,
    },
    fundsState: FundsState.Active,
  }
);

logger.info(result);

process.exit(0);
