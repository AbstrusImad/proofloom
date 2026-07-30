import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

const root = process.cwd();
const env = readFileSync(resolve(root, "../.env"), "utf8");
const key = env
  .split(/\r?\n/)
  .find((line) => line.startsWith("GENLAYER_PRIVATE_KEY_0="))
  ?.split("=")[1]
  .trim();
if (!key) throw new Error("GENLAYER_PRIVATE_KEY_0 is missing");

const account = createAccount(key);
const client = createClient({ chain: studionet, account });
const code = new Uint8Array(
  readFileSync(resolve(root, "contracts/proofloom.py")),
);
const hash = await client.deployContract({ code, args: [] });
const receipt = await client.waitForTransactionReceipt({
  hash,
  status: TransactionStatus.FINALIZED,
  retries: 260,
  interval: 3000,
});
const leader = receipt.consensus_data?.leader_receipt?.[0];
const succeeded =
  receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN ||
  leader?.execution_result === "SUCCESS";
const contractAddress = receipt.data?.contract_address;
if (!succeeded || !contractAddress) throw new Error(JSON.stringify(receipt));

const deployment = {
  network: "studionet",
  chainId: 61999,
  contractAddress,
  transactionHash: hash,
  deployer: account.address,
  publisher: "AbstrusImad",
  explorer: "https://explorer-studio.genlayer.com",
  deployedAt: new Date().toISOString(),
};
mkdirSync(resolve(root, "deployments"), { recursive: true });
mkdirSync(resolve(root, "app"), { recursive: true });
writeFileSync(
  resolve(root, "deployments/studionet.json"),
  `${JSON.stringify(deployment, null, 2)}\n`,
);
writeFileSync(
  resolve(root, "app/.env.production"),
  `VITE_CONTRACT_ADDRESS=${contractAddress}\nVITE_EXPLORER_URL=https://explorer-studio.genlayer.com\n`,
);
console.log(JSON.stringify(deployment, null, 2));
