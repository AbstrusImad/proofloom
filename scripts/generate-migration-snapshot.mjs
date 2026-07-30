import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const contractPath = resolve(root, "contracts/proofloom.py");
const snapshot = JSON.parse(
  readFileSync(resolve(root, "deployments/live-state-studionet.json"), "utf8"),
).state;

const collections = [
  ["get_guilds", "guild_ids", "guilds", "Guild", ["id", "founder", "name", "domain", "charter_url", "reputation", "mentor_count", "path_count", "standard_count", "pool", "status"]],
  ["get_mentors", "mentor_ids", "mentors", "Mentor", ["id", "account", "guild_id", "name", "specialty", "profile_url", "reputation", "attestations", "successful_reviews", "status"]],
  ["get_standards", "standard_ids", "standards", "CompetencyStandard", ["id", "guild_id", "author", "title", "description", "rubric_url", "status", "yes", "no", "epoch"]],
  ["get_paths", "path_ids", "paths", "LearningPath", ["id", "apprentice", "guild_id", "title", "goal", "portfolio_url", "status", "target_count", "credential_count", "evidence_count", "challenge_count", "grant_per_credential", "grant_pool", "average_proficiency"]],
  ["get_targets", "target_ids", "targets", "SkillTarget", ["id", "path_id", "standard_id", "label", "objective", "status", "evidence_id", "credential_id", "proficiency", "confidence", "verdict", "reasoning"]],
  ["get_attestations", "attestation_ids", "attestations", "PracticeAttestation", ["id", "path_id", "target_id", "mentor_id", "statement", "evidence_url", "status"]],
  ["get_evidence", "evidence_ids", "evidence", "PortfolioEvidence", ["id", "path_id", "target_id", "author", "summary", "evidence_url", "status"]],
  ["get_credentials", "credential_ids", "credentials", "Credential", ["id", "path_id", "target_id", "standard_id", "holder", "title", "proficiency", "confidence", "status", "reasoning", "challenge_count"]],
  ["get_challenges", "challenge_ids", "challenges", "CredentialChallenge", ["id", "credential_id", "challenger", "grounds", "evidence_url", "bond", "status", "verdict", "reasoning"]],
  ["get_opportunities", "opportunity_ids", "opportunities", "Opportunity", ["id", "publisher", "guild_id", "title", "description", "requirements", "public_url", "reward", "reserve", "status", "application_count", "accepted_match_id"]],
  ["get_matches", "match_ids", "matches", "OpportunityMatch", ["id", "opportunity_id", "path_id", "applicant", "status", "verdict", "fit_score", "gaps", "reasoning", "reward_created"]],
];

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
const u256Fields = new Set([
  "pool",
  "grant_per_credential",
  "grant_pool",
  "bond",
  "reward",
  "reserve",
  "reward_created",
]);
const u32Fields = new Set([
  "reputation",
  "mentor_count",
  "path_count",
  "standard_count",
  "attestations",
  "successful_reviews",
  "yes",
  "no",
  "epoch",
  "target_count",
  "credential_count",
  "evidence_count",
  "challenge_count",
  "average_proficiency",
  "proficiency",
  "confidence",
  "application_count",
  "fit_score",
]);
const compactTextFields = new Set([
  "domain",
  "specialty",
  "description",
  "goal",
  "objective",
  "statement",
  "summary",
  "reasoning",
  "grounds",
  "requirements",
  "gaps",
]);
const urlFields = new Set([
  "charter_url",
  "profile_url",
  "rubric_url",
  "portfolio_url",
  "evidence_url",
  "public_url",
]);

function pyString(value) {
  return JSON.stringify(String(value));
}

function pyValue(field, value) {
  if (addressFields.has(field)) return "self.owner";
  if (u256Fields.has(field)) return `u256(${String(value)})`;
  if (u32Fields.has(field)) return `u32(${Number(value)})`;
  if (urlFields.has(field)) return pyString("https://www.w3.org/");
  if (compactTextFields.has(field) && String(value).length > 56) {
    return pyString(`${String(value).slice(0, 53).trimEnd()}...`);
  }
  return pyString(value);
}

const lines = [
  "    # MIGRATION_SNAPSHOT_START",
  "    def _load_migrated_snapshot(self):",
  '        self.migration_source_network = "StudioNet"',
  `        self.migration_source_contract = ${pyString(
    JSON.parse(
      readFileSync(
        resolve(root, "deployments/live-state-studionet.json"),
        "utf8",
      ),
    ).contractAddress,
  )}`,
  "        self.migration_source_transactions = u32(72)",
  "",
];

for (const [source, ids, store, className, fields] of collections) {
  for (const record of snapshot[source]) {
    const values = fields.map((field) => pyValue(field, record[field]));
    lines.push(
      `        self.${ids}.append(${pyString(record.id)}); self.${store}[${pyString(record.id)}] = ${className}(${values.join(", ")})`,
    );
  }
}

const overview = snapshot.get_overview;
lines.push(
  `        self.total_learning_pool = u256(${String(
    overview.total_learning_pool,
  )})`,
  `        self.total_opportunity_reserve = u256(${String(
    overview.total_opportunity_reserve,
  )})`,
  `        self.total_claimable_created = u256(${String(
    overview.total_claimable_created,
  )})`,
  `        self.governance_epoch = u32(${overview.governance_epoch})`,
  "    # MIGRATION_SNAPSHOT_END",
);

const source = readFileSync(contractPath, "utf8");
const next = source.replace(
  /    # MIGRATION_SNAPSHOT_START[\s\S]*?    # MIGRATION_SNAPSHOT_END/,
  lines.join("\n"),
);
if (next === source) {
  throw new Error("Migration snapshot markers were not found");
}
writeFileSync(contractPath, next);
console.log(
  `Embedded ${collections.reduce(
    (total, [key]) => total + snapshot[key].length,
    0,
  )} migrated records`,
);
