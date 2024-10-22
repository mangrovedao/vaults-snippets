import { createWalletClient, http, publicActions, type Hex } from "viem";
import { arbitrum, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export const baseSepoliaClient = createWalletClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC_URL),
  account: privateKeyToAccount(process.env.PK as Hex),
}).extend(publicActions);

export const arbitrumClient = createWalletClient({
  chain: arbitrum,
  transport: http(process.env.ARBITRUM_RPC_URL),
  account: privateKeyToAccount(process.env.PK as Hex),
}).extend(publicActions);
