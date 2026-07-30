import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const deployment = JSON.parse(readFileSync("deployments/studionet.json"));
const client = createClient({ chain: studionet });
const methods = [
  "get_overview",
  "get_guilds",
  "get_mentors",
  "get_standards",
  "get_paths",
  "get_targets",
  "get_attestations",
  "get_evidence",
  "get_credentials",
  "get_challenges",
  "get_opportunities",
  "get_matches",
];
const sleep = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
const state = {};

for (const functionName of methods) {
  let lastError;
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    try {
      state[functionName] = await client.readContract({
        address: deployment.contractAddress,
        functionName,
        args: [],
        jsonSafeReturn: true,
      });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      await sleep(Math.min(25000, attempt * 2500));
    }
  }
  if (lastError) throw lastError;
}

const output = {
  verifiedAt: new Date().toISOString(),
  contractAddress: deployment.contractAddress,
  state,
};
writeFileSync(
  "deployments/live-state.json",
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(JSON.stringify(output, null, 2));
