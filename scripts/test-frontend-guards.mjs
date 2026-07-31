import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateAction } from "../app/src/services/actionRules.js";

const account = "0x95803126315A05E642D8E46CE1d77eA2199a2A6E";
const data = {
  guilds: [{ id: "G-001", founder: account, status: "ACTIVE" }],
  paths: [
    { id: "P-0009", apprentice: account, guild_id: "G-001", status: "OPEN" },
  ],
  targets: [
    { id: "T-0009", path_id: "P-0009", status: "PRACTICING" },
    { id: "T-0010", path_id: "P-0009", status: "EVIDENCE_SUBMITTED" },
  ],
  standards: [
    { id: "S-0001", guild_id: "G-001", status: "PASSED", yes: 1, no: 0 },
  ],
  opportunities: [
    { id: "O-0001", guild_id: "G-001", status: "OPEN", publisher: account },
  ],
  matches: [],
  credentials: [],
  challenges: [],
  mentors: [],
  profile: { claimable: "0" },
};

assert.match(
  validateAction(
    "review_competency",
    { target_id: "T-0009" },
    data,
    account,
  ),
  /Submit evidence before running competency consensus/,
);
assert.equal(
  validateAction(
    "review_competency",
    { target_id: "T-0010" },
    data,
    account,
  ),
  "",
);
assert.match(
  validateAction(
    "sponsor_path",
    { path_id: "P-0009", value: "0" },
    data,
    account,
  ),
  /positive GEN sponsorship/,
);
assert.equal(
  validateAction(
    "add_target",
    { path_id: "P-0009", standard_id: "S-0001" },
    data,
    account,
  ),
  "",
);
assert.match(
  validateAction("claim", {}, data, account),
  /no claimable GEN/,
);
assert.match(
  validateAction(
    "submit_evidence",
    {
      target_id: "T-0009",
      summary: "Too short",
      evidence_url: "http://example.com",
    },
    data,
    account,
  ),
  /at least 120 characters/,
);
assert.match(
  validateAction(
    "publish_opportunity",
    {
      guild_id: "G-001",
      title: "Valid title",
      description: "x".repeat(100),
      requirements: "x".repeat(100),
      public_url: "https://example.com/brief",
      reward: "0.02",
      value: "0.01",
    },
    data,
    account,
  ),
  /reserve must cover/,
);
const frontendSource = readFileSync("app/src/main.js", "utf8");
assert.match(frontendSource, /explorerUrl}\/tx\/\$\{tx\.hash\}/);
assert.doesNotMatch(frontendSource, /explorerUrl}\/transactions\//);

console.log("Frontend transaction guards and explorer routes passed (9 cases)");
