import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

export const contractAddress =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0xcd0eA9F2e9058998d0e7D6C81c520CDEd522bF1C";
export const explorerUrl =
  import.meta.env.VITE_EXPLORER_URL || "https://explorer-studio.genlayer.com";

const publicClient = createClient({ chain: studionet });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const stringify = (value) => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const clean = (value) => {
  let message = stringify(value || "").trim();
  try {
    const parsed = JSON.parse(message);
    message =
      typeof parsed === "string"
        ? parsed
        : stringify(parsed?.message || parsed?.error || parsed);
  } catch {
    // GenVM errors may also arrive as plain strings.
  }
  return message
    .replace(/^\[(EXPECTED|EXTERNAL|TRANSIENT|LLM_ERROR)\]\s*/i, "")
    .replace(/^UserError:\s*/i, "")
    .trim();
};

const isTransient = (error) => {
  const value = stringify(error?.details || error?.message || error);
  return /Server busy|-32028|429|timeout|NO_MAJORITY/i.test(value);
};

async function retry(operation, attempts = 8) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransient(error) || attempt === attempts) throw error;
      await sleep(650 * attempt);
    }
  }
}

export async function connectWallet({ silent = false } = {}) {
  if (!window.ethereum) {
    if (silent) return null;
    throw new Error("Install or unlock a compatible browser wallet.");
  }
  const accounts = await window.ethereum.request({
    method: silent ? "eth_accounts" : "eth_requestAccounts",
  });
  const address = accounts?.[0];
  if (!address) return null;
  const client = createClient({ chain: studionet, account: address });
  if (!silent) await client.connect("studionet");
  return { address, client };
}

export const readContract = (functionName, args = []) =>
  retry(() =>
    publicClient.readContract({
      address: contractAddress,
      functionName,
      args,
      jsonSafeReturn: true,
    }),
  );

const leader = (receipt) =>
  receipt?.consensus_data?.leader_receipt?.[0] ||
  receipt?.consensusData?.leaderReceipt?.[0];

const decode = (value) => {
  if (typeof value !== "string" || !value) return "";
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")),
      (char) => char.charCodeAt(0),
    );
    return [1, 2, 3].includes(bytes[0])
      ? new TextDecoder().decode(bytes.slice(1))
      : "";
  } catch {
    return "";
  }
};

const receiptError = (receipt) => {
  const record = leader(receipt);
  const candidates = [
    decode(record?.result),
    ...Object.values(record?.eq_outputs || {}).map(decode),
    record?.genvm_result?.error_description,
    record?.genvm_result?.stderr,
    receipt?.error,
  ];
  for (const candidate of candidates) {
    const message = clean(candidate);
    if (message && message !== "FINISHED_WITH_ERROR") return message;
  }
  return "The contract rejected this action.";
};

export function formatError(error) {
  for (const candidate of [
    error?.shortMessage,
    error?.details,
    error?.cause?.message,
    error?.message,
    error,
  ]) {
    const message = clean(candidate);
    if (message && message !== "[object Object]") return message;
  }
  return "The action could not be completed.";
}

export async function writeContract({
  client,
  functionName,
  args = [],
  value,
  onStage,
}) {
  if (!client) throw new Error("Connect your wallet first.");
  onStage?.("signature");
  await client.connect("studionet");
  const hash = await retry(() =>
    client.writeContract({
      address: contractAddress,
      functionName,
      args,
      ...(value ? { value: BigInt(value) } : {}),
    }),
  );
  onStage?.("consensus", hash);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    retries: 120,
    interval: 3_000,
  });
  const succeeded =
    receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN ||
    leader(receipt)?.execution_result === "SUCCESS";
  if (!succeeded) throw new Error(receiptError(receipt));
  onStage?.("accepted", hash);
  return { hash, receipt };
}
