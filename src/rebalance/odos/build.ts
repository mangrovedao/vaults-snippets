import type { Address, Hex } from "viem";

const ASSEMBLE_ENDPOINT = "https://api.odos.xyz/sor/assemble";

type AssembleRequest = {
  pathId: string;
  simulate: boolean;
  userAddr: Address;
};

type OdosAssembleResponse = {
  deprecated: null;
  blockNumber: number;
  gasEstimate: number;
  gasEstimateValue: number;
  inputTokens: {
    tokenAddress: Address;
    amount: string;
  }[];
  outputTokens: {
    tokenAddress: Address;
    amount: string;
  }[];
  netOutValue: number;
  outValues: string[];
  transaction: {
    gas: number;
    gasPrice: bigint;
    value: string;
    to: Address;
    from: Address;
    data: Hex;
    nonce: number;
    chainId: number;
  };
  simulation: null;
};

async function assembleOdosSwap(
  pathId: string,
  userAddr: Address,
  simulate: boolean = false
): Promise<OdosAssembleResponse> {
  const request: AssembleRequest = {
    pathId,
    simulate,
    userAddr,
  };

  const response = await fetch(ASSEMBLE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export async function buildOdosSwap(
  vault: Address,
  pathId: string
) {
  const response = await assembleOdosSwap(pathId, vault);
  return response;
}
