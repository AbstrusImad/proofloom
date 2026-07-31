import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = JSON.parse(
  readFileSync(resolve(root, "deployments/live-state-studionet.json"), "utf8"),
);
const state = source.state;
const profile = {
  account: "0x95803126315A05E642D8E46CE1d77eA2199a2A6E",
  claimable: "198400000000000000",
  credentials: 6,
  mentorships: 3,
  opportunities: 4,
  paths: 9,
  reputation: 74,
};
const migration = {
  source: {
    network: "StudioNet",
    contract: source.contractAddress,
    accepted_transactions: 72,
    verified_at: source.verifiedAt,
  },
  overview: state.get_overview,
  profile,
  guilds: state.get_guilds,
  mentors: state.get_mentors,
  standards: state.get_standards,
  paths: state.get_paths,
  targets: state.get_targets,
  attestations: state.get_attestations,
  evidence: state.get_evidence,
  credentials: state.get_credentials,
  challenges: state.get_challenges,
  opportunities: state.get_opportunities,
  matches: state.get_matches,
};
const payload = JSON.stringify(migration);
const snapshotHash = createHash("sha256").update(payload).digest("hex");
const manifest = {
  snapshotHash,
  payloadBytes: Buffer.byteLength(payload),
  migratedRecords: Object.values({
    guilds: migration.guilds,
    mentors: migration.mentors,
    standards: migration.standards,
    paths: migration.paths,
    targets: migration.targets,
    attestations: migration.attestations,
    evidence: migration.evidence,
    credentials: migration.credentials,
    challenges: migration.challenges,
    opportunities: migration.opportunities,
    matches: migration.matches,
  }).reduce((total, records) => total + records.length, 0),
  backingWei: "875000000000000000",
  backingGen: "0.875",
};

writeFileSync(
  resolve(root, "deployments/migration-payload.json"),
  `${JSON.stringify(migration, null, 2)}\n`,
);
writeFileSync(
  resolve(root, "deployments/migration-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(JSON.stringify(manifest, null, 2));
