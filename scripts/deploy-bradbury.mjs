import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

const root = process.cwd();
const waitForFinalized = process.argv.includes("--wait-finalized");
const deploymentPath = resolve(root, "deployments/bradbury.json");
const previousDeployment = existsSync(deploymentPath)
  ? JSON.parse(readFileSync(deploymentPath, "utf8"))
  : null;
const sourceSnapshot = JSON.parse(
  readFileSync(resolve(root, "deployments/live-state-studionet.json"), "utf8"),
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
const contractSource = readFileSync(
  resolve(root, "contracts/proofloom.py"),
  "utf8",
);
const deploySource = `${contractSource
  .split(/\r?\n/)
  .filter(
    (line, index) =>
      index === 0 ||
      (line.trim().length > 0 && !line.trimStart().startsWith("#")),
  )
  .map((line) => {
    const indentation = line.match(/^ */)?.[0].length || 0;
    return `${" ".repeat(Math.ceil(indentation / 4))}${line.trimStart().trimEnd()}`;
  })
  .join("\n")}\n`;
const code = new TextEncoder().encode(deploySource);
const contractSha256 = createHash("sha256").update(code).digest("hex");
const hash = await client.deployContract({
  code,
  args: [true],
  leaderOnly: true,
});
console.log(`Bradbury deployment submitted: ${hash}`);
const receipt = await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.ACCEPTED,
  retries: 360,
  interval: 3000,
});
const leader = receipt.consensus_data?.leader_receipt?.[0];
const succeeded =
  receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN ||
  leader?.execution_result === "SUCCESS";
const contractAddress =
  receipt.data?.contractAddress || receipt.data?.contract_address;
if (!succeeded || !contractAddress) {
  throw new Error(
    JSON.stringify(receipt, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value),
  );
}

async function finalizeAfterAppealWindow(txId) {
  for (let attempt = 1; attempt <= 720; attempt += 1) {
    const response = await fetch(testnetBradbury.rpcUrls.default.http[0], {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "gen_getTransactionStatus",
        params: [{ txId }],
        id: attempt,
      }),
    });
    const payload = await response.json();
    const status = payload?.result?.statusCode;
    if (status === 7) return;
    if (status === 11) {
      await client.finalizeTransaction({ txId });
      await client.waitForTransactionReceipt({
        hash: txId,
        status: TransactionStatus.FINALIZED,
        retries: 40,
        interval: 3000,
      });
      return;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 30000));
  }
  throw new Error(`Bradbury finalization window did not close for ${txId}`);
}

if (waitForFinalized) {
  await finalizeAfterAppealWindow(hash);
}

const deployment = {
  network: "testnet-bradbury",
  chainId: 4221,
  contractAddress,
  transactionHash: hash,
  deployer: account.address,
  publisher: "AbstrusImad",
  explorer: "https://explorer-bradbury.genlayer.com",
  status: waitForFinalized ? "FINALIZED" : "ACCEPTED",
  executionResult: "FINISHED_WITH_RETURN",
  deployedAt: new Date().toISOString(),
  contractSha256,
  migration: {
    sourceNetwork: "StudioNet",
    sourceContract: sourceSnapshot.contractAddress,
    sourceVerifiedAt: sourceSnapshot.verifiedAt,
    acceptedSourceTransactions: 72,
    migratedRecords: 57,
  },
  supersedes:
    previousDeployment?.contractAddress &&
    previousDeployment.contractAddress !== contractAddress
      ? {
          contractAddress: previousDeployment.contractAddress,
          transactionHash: previousDeployment.transactionHash,
          reason: "Replaced by the complete deterministic migration deployment",
        }
      : null,
};
mkdirSync(resolve(root, "deployments"), { recursive: true });
mkdirSync(resolve(root, "app"), { recursive: true });
writeFileSync(
  deploymentPath,
  `${JSON.stringify(deployment, null, 2)}\n`,
);
writeFileSync(
  resolve(root, "app/.env.production"),
  `VITE_CONTRACT_ADDRESS=${contractAddress}\nVITE_EXPLORER_URL=https://explorer-bradbury.genlayer.com\n`,
);
console.log(JSON.stringify(deployment, null, 2));
