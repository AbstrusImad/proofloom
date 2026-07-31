import { readFileSync, writeFileSync } from "node:fs";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const deployment = JSON.parse(readFileSync("deployments/bradbury.json"));
const migration = JSON.parse(
  readFileSync("deployments/migration-payload.json"),
);
const manifest = JSON.parse(
  readFileSync("deployments/migration-manifest.json"),
);
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
  ...migration.overview,
  migration_source_network: migration.source.network,
  migration_source_contract: migration.source.contract,
  migration_source_transactions: migration.source.accepted_transactions,
  migration_snapshot_hash: manifest.snapshotHash,
  migration_backing: manifest.backingWei,
  migration_complete: true,
};
for (const [field, expected] of Object.entries(expectedOverview)) {
  const actual = state.get_overview[field];
  if (String(actual).toLowerCase() !== String(expected).toLowerCase()) {
    throw new Error(
      `Bradbury state mismatch for ${field}: expected ${expected}, received ${actual}`,
    );
  }
}

const [profile, balance] = await Promise.all([
  client.readContract({
    address: deployment.contractAddress,
    functionName: "get_profile",
    args: [migration.profile.account],
    jsonSafeReturn: true,
  }),
  client.getBalance({ address: deployment.contractAddress }),
]);

const addressFields = new Set([
  "founder",
  "account",
  "author",
  "apprentice",
  "holder",
  "challenger",
  "publisher",
  "applicant",
]);
const numericStringFields = new Set([
  "pool",
  "grant_per_credential",
  "grant_pool",
  "bond",
  "reward",
  "reserve",
  "reward_created",
]);
function normalize(value, field = "") {
  if (Array.isArray(value)) return value.map((item) => normalize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalize(item, key)]),
    );
  }
  if (addressFields.has(field) && typeof value === "string") {
    return value.toLowerCase();
  }
  if (numericStringFields.has(field)) return String(value);
  return value;
}

const collectionPairs = [
  ["get_guilds", "guilds"],
  ["get_mentors", "mentors"],
  ["get_standards", "standards"],
  ["get_paths", "paths"],
  ["get_targets", "targets"],
  ["get_attestations", "attestations"],
  ["get_evidence", "evidence"],
  ["get_credentials", "credentials"],
  ["get_challenges", "challenges"],
  ["get_opportunities", "opportunities"],
  ["get_matches", "matches"],
];
for (const [method, key] of collectionPairs) {
  const actual = JSON.stringify(normalize(state[method]));
  const expected = JSON.stringify(normalize(migration[key]));
  if (actual !== expected) {
    throw new Error(`Bradbury state differs from StudioNet for ${key}`);
  }
}
if (
  JSON.stringify(normalize(profile)) !==
  JSON.stringify(normalize(migration.profile))
) {
  throw new Error("Bradbury profile differs from the StudioNet profile");
}
if (balance.toString() !== manifest.backingWei) {
  throw new Error(
    `Bradbury backing mismatch: expected ${manifest.backingWei}, received ${balance}`,
  );
}

const output = {
  verifiedAt: new Date().toISOString(),
  contractAddress: deployment.contractAddress,
  network: "testnet-bradbury",
  migrationVerified: true,
  snapshotHash: manifest.snapshotHash,
  contractBalance: balance.toString(),
  profile,
  state,
};
writeFileSync(
  "deployments/live-state.json",
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(JSON.stringify(output, null, 2));
