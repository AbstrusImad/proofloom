import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const txId = process.argv[2];
if (!txId) throw new Error("Usage: node scripts/finalize-pending.mjs <tx-id>");

const env = readFileSync(resolve(process.cwd(), "../.env"), "utf8");
const key = env
  .split(/\r?\n/)
  .find((line) => line.startsWith("GENLAYER_PRIVATE_KEY_0="))
  ?.split("=")[1]
  .trim();
if (!key) throw new Error("GENLAYER_PRIVATE_KEY_0 is missing");

const client = createClient({
  chain: testnetBradbury,
  account: createAccount(key),
});
await client.finalizeTransaction({ txId });
console.log(`Finalized ${txId}`);
