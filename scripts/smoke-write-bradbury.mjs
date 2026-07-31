import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

if (!process.argv.includes("--execute")) {
  throw new Error(
    "This script sends 0.001 GEN. Run with --execute after reviewing it.",
  );
}

const root = process.cwd();
const deployment = JSON.parse(
  readFileSync(resolve(root, "deployments/bradbury.json"), "utf8"),
);
const env = readFileSync(resolve(root, "../.env"), "utf8");
const key = env
  .split(/\r?\n/)
  .find((line) => line.startsWith("GENLAYER_PRIVATE_KEY_0="))
  ?.split("=")[1]
  .trim();
if (!key) throw new Error("GENLAYER_PRIVATE_KEY_0 is missing");

const account = createAccount(key);
const client = createClient({ chain: testnetBradbury, account });
const pathId = "P-0009";
const value = 1_000_000_000_000_000n;
const before = await client.readContract({
  address: deployment.contractAddress,
  functionName: "get_paths",
  args: [],
  jsonSafeReturn: true,
});
const beforePool = BigInt(before.find((path) => path.id === pathId).grant_pool);

const hash = await client.writeContract({
  address: deployment.contractAddress,
  functionName: "sponsor_path",
  args: [pathId],
  value,
});
console.log(`Bradbury write smoke submitted: ${hash}`);

const receipt = await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.ACCEPTED,
  retries: 180,
  interval: 3_000,
});
const leader = receipt.consensus_data?.leader_receipt?.[0];
const succeeded =
  receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN ||
  leader?.execution_result === "SUCCESS";
if (!succeeded) {
  throw new Error(
    JSON.stringify(receipt, (_key, item) =>
      typeof item === "bigint" ? item.toString() : item,
    ),
  );
}

const after = await client.readContract({
  address: deployment.contractAddress,
  functionName: "get_paths",
  args: [],
  jsonSafeReturn: true,
});
const afterPool = BigInt(after.find((path) => path.id === pathId).grant_pool);
if (afterPool !== beforePool + value) {
  throw new Error("Accepted transaction did not increase the path pool");
}

const record = {
  verifiedAt: new Date().toISOString(),
  network: "testnet-bradbury",
  contractAddress: deployment.contractAddress,
  functionName: "sponsor_path",
  args: [pathId],
  valueWei: value.toString(),
  transactionHash: hash,
  status: "ACCEPTED",
  executionResult: "FINISHED_WITH_RETURN",
  beforePool: beforePool.toString(),
  afterPool: afterPool.toString(),
};
writeFileSync(
  resolve(root, "deployments/write-smoke.json"),
  `${JSON.stringify(record, null, 2)}\n`,
);
console.log(JSON.stringify(record, null, 2));
