import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const txId = process.argv[2];
if (!txId) throw new Error("Usage: node scripts/status-bradbury.mjs <tx-id>");

const client = createClient({ chain: testnetBradbury });
const transaction = await client.getTransaction({ hash: txId });
console.log(JSON.stringify(transaction, (_, value) =>
  typeof value === "bigint" ? value.toString() : value, 2));
