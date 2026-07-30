import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const deployment = JSON.parse(readFileSync("deployments/bradbury.json"));
const client = createClient({ chain: testnetBradbury });
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

const expectedOverview = {
  guilds: 3,
  mentors: 3,
  standards: 6,
  active_standards: 5,
  paths: 9,
  targets: 9,
  attestations: 6,
  evidence: 7,
  credentials: 6,
  active_credentials: 5,
  opportunities: 4,
  open_opportunities: 3,
  matches: 3,
  governance_epoch: 4,
  total_learning_pool: "386600000000000000",
  total_opportunity_reserve: "290000000000000000",
  total_claimable_created: "198400000000000000",
  migration_source_network: "StudioNet",
  migration_source_contract: "0xcd0eA9F2e9058998d0e7D6C81c520CDEd522bF1C",
  migration_source_transactions: 72,
};
for (const [field, expected] of Object.entries(expectedOverview)) {
  const actual = state.get_overview[field];
  if (String(actual).toLowerCase() !== String(expected).toLowerCase()) {
    throw new Error(
      `Bradbury state mismatch for ${field}: expected ${expected}, received ${actual}`,
    );
  }
}

const output = {
  verifiedAt: new Date().toISOString(),
  contractAddress: deployment.contractAddress,
  network: "testnet-bradbury",
  migrationVerified: true,
  state,
};
writeFileSync(
  "deployments/live-state.json",
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(JSON.stringify(output, null, 2));
