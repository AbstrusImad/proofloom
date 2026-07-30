import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { ExecutionResult, TransactionStatus } from "genlayer-js/types";

const root = process.cwd();
const checkpointPath = resolve(root, "deployments/seed-studionet.json");
const deployment = JSON.parse(
  readFileSync(resolve(root, "deployments/studionet.json")),
);
const env = readFileSync(resolve(root, "../.env"), "utf8");
const key = env
  .split(/\r?\n/)
  .find((line) => line.startsWith("GENLAYER_PRIVATE_KEY_0="))
  ?.split("=")[1]
  .trim();
if (!key) throw new Error("GENLAYER_PRIVATE_KEY_0 is missing");

const account = createAccount(key);
const client = createClient({ chain: studionet, account });
const address = deployment.contractAddress;
const previous = existsSync(checkpointPath)
  ? JSON.parse(readFileSync(checkpointPath, "utf8"))
  : {};
const transactions =
  previous.contractAddress === address ? previous.transactions || [] : [];
const sleep = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
const leader = (receipt) => receipt.consensus_data?.leader_receipt?.[0];
const json = (value) =>
  JSON.stringify(
    value,
    (_key, item) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );

function persist(extra = {}) {
  writeFileSync(
    checkpointPath,
    `${json({
      seededAt: new Date().toISOString(),
      account: account.address,
      publisher: "AbstrusImad",
      contractAddress: address,
      transactions,
      ...extra,
    })}\n`,
  );
}

async function read(functionName, args = []) {
  let lastError;
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    try {
      return await client.readContract({
        address,
        functionName,
        args,
        jsonSafeReturn: true,
      });
    } catch (error) {
      lastError = error;
      console.log(`Read retry ${attempt}/18 for ${functionName}`);
      await sleep(Math.min(30000, attempt * 3000));
    }
  }
  throw lastError;
}

async function waitApplied(hash) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const receipt = await client.waitForTransactionReceipt({
        hash,
        status: TransactionStatus.ACCEPTED,
        retries: 80,
        interval: 3000,
      });
      const succeeded =
        receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN ||
        leader(receipt)?.execution_result === "SUCCESS";
      if (!succeeded) throw new Error(json(receipt));
      return;
    } catch (error) {
      const text = String(error?.message || error);
      if (
        text.includes("execution_result") ||
        text.includes("FINISHED_WITH_ERROR")
      ) {
        throw error;
      }
      console.log(`Receipt retry ${attempt}/12 for ${hash}`);
      if (attempt === 12) throw error;
      await sleep(Math.min(30000, attempt * 5000));
    }
  }
}

async function write(functionName, args = [], value = 0n) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    let transaction;
    try {
      console.log(`Submitting ${functionName} attempt ${attempt}/5`);
      const hash = await client.writeContract({
        address,
        functionName,
        args,
        value,
      });
      transaction = {
        functionName,
        args,
        value: value.toString(),
        hash,
        succeeded: null,
        submittedAt: new Date().toISOString(),
      };
      transactions.push(transaction);
      persist();
      await waitApplied(hash);
      transaction.succeeded = true;
      transaction.acceptedAt = new Date().toISOString();
      persist();
      await sleep(1800);
      return;
    } catch (error) {
      lastError = error;
      if (transaction) {
        transaction.succeeded = false;
        transaction.error = String(error?.message || error).slice(0, 1200);
        persist();
      }
      const text = String(error?.message || error);
      const transient =
        text.includes("Server busy") ||
        text.includes("-32028") ||
        text.includes("429") ||
        text.includes("TIMEOUT") ||
        text.includes("timeout") ||
        text.includes("NO_MAJORITY") ||
        text.includes("CONSENSUS");
      if (!transient || attempt === 5) throw error;
      console.log(`Transient failure for ${functionName}; waiting to retry`);
      await sleep(25000 + attempt * 10000);
    }
  }
  throw lastError;
}

const guildBlueprints = [
  [
    "Human Systems Guild",
    "Service design, operational research, facilitation, public-interest delivery, and accountable organizational learning",
    "https://www.w3.org/TR/vc-data-model-2.0/",
  ],
  [
    "Circular Fabrication Guild",
    "Repair diagnosis, material stewardship, fabrication practice, workshop safety, and documented technical handoff",
    "https://www.w3.org/TR/vc-data-model-2.0/",
  ],
];
for (const guild of guildBlueprints) {
  const live = await read("get_guilds");
  if (!live.some((item) => item.name === guild[0])) {
    await write("register_guild", guild);
  }
}

const guilds = await read("get_guilds");
const guildId = (name) => guilds.find((item) => item.name === name)?.id;
const mentorBlueprints = [
  [
    guildId("Human Systems Guild"),
    "Service Evidence Studio",
    "Field research synthesis, facilitation records, service prototyping, public evidence, and accountable operational handoff",
    "https://www.w3.org/TR/vc-data-model-2.0/",
    account.address,
  ],
  [
    guildId("Circular Fabrication Guild"),
    "Repair Practice Circle",
    "Material diagnosis, safe workshop practice, repair documentation, lifecycle decisions, and professional client handoff",
    "https://www.w3.org/TR/vc-data-model-2.0/",
    account.address,
  ],
];
for (const mentor of mentorBlueprints) {
  const live = await read("get_mentors");
  if (!live.some((item) => item.name === mentor[1])) {
    await write("register_mentor", mentor);
  }
}

const standardBlueprints = [
  [
    guildId("Human Systems Guild"),
    "Public service research synthesis",
    "Demonstrate an ethical research question, traceable field observations, explicit synthesis decisions, participant-safe evidence, and a practical service recommendation with limitations.",
    "https://www.w3.org/TR/vc-data-model-2.0/",
  ],
  [
    guildId("Human Systems Guild"),
    "Facilitated decision practice",
    "Demonstrate an inclusive decision process, accessible preparation, traceable contributions, resolved disagreement, and a documented decision that participants can independently inspect.",
    "https://www.w3.org/TR/vc-data-model-2.0/",
  ],
  [
    guildId("Circular Fabrication Guild"),
    "Repair diagnosis and safe handoff",
    "Demonstrate fault isolation, material and safety reasoning, a bounded repair procedure, before-and-after evidence, verification checks, and a client-readable handoff.",
    "https://www.w3.org/TR/vc-data-model-2.0/",
  ],
  [
    "G-001",
    "Transparent assisted practice",
    "A portfolio using automated assistance must identify the tools, disclose material generated contributions, show human verification, and preserve enough evidence to reproduce each professional decision.",
    "https://www.w3.org/TR/vc-data-model-2.0/",
  ],
];
for (const standard of standardBlueprints) {
  const live = await read("get_standards");
  if (!live.some((item) => item.title === standard[1])) {
    await write("create_standard", standard);
  }
}

let standards = await read("get_standards");
for (const standard of standards.filter((item) => item.status === "OPEN")) {
  if (Number(standard.yes) + Number(standard.no) === 0) {
    await write("vote_standard", [standard.id, standard.title !== "Transparent assisted practice"]);
  }
}
standards = await read("get_standards");
for (const standard of standards.filter(
  (item) =>
    item.status === "OPEN" &&
    item.title !== "Transparent assisted practice" &&
    Number(item.yes) + Number(item.no) > 0,
)) {
  await write("close_standard", [standard.id]);
}

standards = await read("get_standards");
const standardId = (title) =>
  standards.find((item) => item.title === title)?.id;
const paths = [
  {
    guild: "G-001",
    standard: "S-0001",
    title: "Evidence Systems Practitioner",
    goal: "Build a production-grade evidence workflow with explicit acceptance criteria, reproducible public artifacts, accountable review, and a professional operational handoff.",
    target: "Evidence-led delivery",
    objective:
      "Deliver a bounded public project, document principal decisions and acceptance criteria, publish reproducible evidence, and explain the final professional handoff.",
  },
  {
    guild: "G-001",
    standard: "S-0002",
    title: "Collaborative Review Steward",
    goal: "Develop repeatable collaborative review practice through traceable feedback, resolved revisions, accountable communication, and contributions that improve shared work.",
    target: "Review and revision practice",
    objective:
      "Provide constructive review, trace the resulting revisions, resolve material disagreement, and document an accountable contribution to shared professional work.",
  },
  {
    guild: guildId("Human Systems Guild"),
    standard: standardId("Public service research synthesis"),
    title: "Public Service Researcher",
    goal: "Turn ethical field observations into a traceable synthesis and a practical public-service recommendation while preserving participant safety and evidentiary limits.",
    target: "Research synthesis",
    objective:
      "Frame an ethical question, collect traceable observations, explain synthesis choices, protect participants, and publish an actionable recommendation with limitations.",
  },
  {
    guild: guildId("Human Systems Guild"),
    standard: standardId("Facilitated decision practice"),
    title: "Decision Facilitation Practitioner",
    goal: "Design and facilitate an inclusive decision process whose preparation, contributions, disagreements, and final commitment remain publicly inspectable.",
    target: "Facilitated decision",
    objective:
      "Prepare an accessible session, capture contributions, resolve disagreement, document the decision, and preserve evidence that participants can independently inspect.",
  },
  {
    guild: guildId("Circular Fabrication Guild"),
    standard: standardId("Repair diagnosis and safe handoff"),
    title: "Circular Repair Technician",
    goal: "Diagnose and repair a bounded product fault using safe workshop practice, material reasoning, reproducible checks, and a clear client handoff.",
    target: "Repair diagnosis",
    objective:
      "Isolate a fault, explain material and safety decisions, complete the repair, publish before-and-after verification, and deliver a client-readable handoff.",
  },
  {
    guild: "G-001",
    standard: "S-0001",
    title: "Open Documentation Builder",
    goal: "Create a public technical guide that another practitioner can reproduce, test, revise, and use without relying on private context or unexplained decisions.",
    target: "Reproducible documentation",
    objective:
      "Publish a bounded guide with prerequisites, tested steps, decision context, failure recovery, verification evidence, and a professional maintenance handoff.",
  },
  {
    guild: guildId("Human Systems Guild"),
    standard: standardId("Public service research synthesis"),
    title: "Community Insight Mapper",
    goal: "Synthesize multiple public-interest observations into an accountable service map that distinguishes evidence, interpretation, uncertainty, and proposed action.",
    target: "Accountable insight map",
    objective:
      "Connect traceable observations to explicit themes, preserve uncertainty and dissent, and publish a practical service map with evidence links and limitations.",
  },
  {
    guild: guildId("Circular Fabrication Guild"),
    standard: standardId("Repair diagnosis and safe handoff"),
    title: "Material Lifecycle Apprentice",
    goal: "Assess a product lifecycle decision using material condition, repairability, safe reuse, disposal constraints, and a documented recommendation.",
    target: "Material lifecycle decision",
    objective:
      "Inspect material condition, compare repair and reuse options, identify safety constraints, document verification, and deliver a defensible lifecycle recommendation.",
  },
  {
    guild: "G-001",
    standard: "S-0002",
    title: "Peer Learning Coordinator",
    goal: "Coordinate a small peer learning cycle with explicit goals, constructive review, traceable revisions, inclusive participation, and a durable shared outcome.",
    target: "Peer learning cycle",
    objective:
      "Set a shared goal, coordinate review, capture revision decisions, support inclusive contribution, and publish the final shared outcome with evidence.",
  },
];

for (let index = 0; index < paths.length; index += 1) {
  const blueprint = paths[index];
  let livePaths = await read("get_paths");
  let path = livePaths.find((item) => item.title === blueprint.title);
  if (!path) {
    await write(
      "create_path",
      [
        blueprint.guild,
        blueprint.title,
        blueprint.goal,
        `https://www.w3.org/TR/vc-data-model-2.0/#proofs-signatures`,
        30000000000000000n,
      ],
      50000000000000000n,
    );
    livePaths = await read("get_paths");
    path = livePaths.find((item) => item.title === blueprint.title);
  }
  const liveTargets = await read("get_targets");
  if (!liveTargets.some((item) => item.path_id === path.id)) {
    await write("add_target", [
      path.id,
      blueprint.standard,
      blueprint.target,
      blueprint.objective,
    ]);
  }
}

for (const title of [
  "Evidence Systems Practitioner",
  "Public Service Researcher",
  "Circular Repair Technician",
  "Open Documentation Builder",
]) {
  const path = (await read("get_paths")).find((item) => item.title === title);
  if (path && BigInt(path.grant_pool) === 50000000000000000n) {
    await write("sponsor_path", [path.id], 25000000000000000n);
  }
}

const mentors = await read("get_mentors");
const mentorForGuild = (guild) =>
  mentors.find((item) => item.guild_id === guild)?.id;
const reviewTitles = paths.slice(0, 6).map((item) => item.title);
for (const title of reviewTitles) {
  const path = (await read("get_paths")).find((item) => item.title === title);
  let target = (await read("get_targets")).find(
    (item) => item.path_id === path.id,
  );
  const liveAttestations = await read("get_attestations");
  if (!liveAttestations.some((item) => item.target_id === target.id)) {
    await write("attest_practice", [
      target.id,
      mentorForGuild(path.guild_id),
      `During supervised practice for ${title}, the apprentice repeatedly planned bounded work, explained decisions, incorporated review, published verifiable artifacts, and completed an accountable professional handoff against the guild objective.`,
      "https://www.w3.org/TR/vc-data-model-2.0/#proofs-signatures",
    ]);
  }
  target = (await read("get_targets")).find((item) => item.id === target.id);
  if (
    ["PRACTICING", "ATTESTED", "MORE_EVIDENCE", "REASSESSMENT"].includes(
      target.status,
    )
  ) {
    await write("submit_evidence", [
      target.id,
      `The ${title} portfolio publishes the bounded outcome, governing objective, source artifacts, review history, verification record, decision rationale, known limitations, and professional handoff so another practitioner can independently inspect the demonstrated competence.`,
      "https://www.w3.org/TR/vc-data-model-2.0/#proofs-signatures",
    ]);
  }
  target = (await read("get_targets")).find((item) => item.id === target.id);
  if (
    ["EVIDENCE_SUBMITTED", "REASSESSMENT"].includes(target.status)
  ) {
    await write("review_competency", [target.id]);
  }
}

const opportunityBlueprints = [
  [
    "G-001",
    "Evidence workflow residency",
    "A bounded professional residency delivering one public evidence workflow, tested acceptance criteria, review documentation, and an accountable handoff to an operating team.",
    "Requires demonstrated evidence-led delivery, reproducible public artifacts, professional communication, accountable review, and a maintained operational handoff.",
  ],
  [
    guildId("Human Systems Guild"),
    "Public service research fellowship",
    "A time-bounded fellowship synthesizing public-interest observations into a traceable recommendation with participant-safe evidence, uncertainty, and implementation guidance.",
    "Requires governed public service research evidence, ethical synthesis, traceable observations, explicit limitations, and a practical recommendation.",
  ],
  [
    guildId("Circular Fabrication Guild"),
    "Community repair residency",
    "A supervised repair residency diagnosing household product faults, documenting safe procedures, verifying outcomes, and producing client-readable lifecycle guidance.",
    "Requires repair diagnosis evidence, workshop safety reasoning, before-and-after verification, material stewardship, and professional handoff.",
  ],
  [
    "G-001",
    "Open documentation commission",
    "A commission to produce a tested public technical guide with reproducible steps, failure recovery, decision context, maintenance responsibilities, and review history.",
    "Requires evidence-led project delivery, reproducible documentation, constructive review practice, and an accountable maintenance handoff.",
  ],
];
for (const blueprint of opportunityBlueprints) {
  const live = await read("get_opportunities");
  if (!live.some((item) => item.title === blueprint[1])) {
    await write(
      "publish_opportunity",
      [
        blueprint[0],
        blueprint[1],
        blueprint[2],
        blueprint[3],
        "https://www.w3.org/TR/vc-data-model-2.0/",
        30000000000000000n,
      ],
      80000000000000000n,
    );
  }
}

const applicationPairs = [
  ["Evidence workflow residency", "Evidence Systems Practitioner"],
  ["Public service research fellowship", "Public Service Researcher"],
  ["Community repair residency", "Circular Repair Technician"],
];
for (const [opportunityTitle, pathTitle] of applicationPairs) {
  const opportunity = (await read("get_opportunities")).find(
    (item) => item.title === opportunityTitle,
  );
  const path = (await read("get_paths")).find(
    (item) => item.title === pathTitle,
  );
  let matches = await read("get_matches");
  let match = matches.find(
    (item) =>
      item.opportunity_id === opportunity.id && item.path_id === path.id,
  );
  if (!match) {
    await write("apply_opportunity", [opportunity.id, path.id]);
    matches = await read("get_matches");
    match = matches.find(
      (item) =>
        item.opportunity_id === opportunity.id && item.path_id === path.id,
    );
  }
  if (match?.status === "PENDING") {
    await write("review_match", [match.id]);
  }
  matches = await read("get_matches");
  match = matches.find((item) => item.id === match.id);
  if (match?.status === "MATCHED") {
    await write("accept_match", [match.id]);
  }
}

let challenges = await read("get_challenges");
const credential =
  challenges.length === 0
    ? (await read("get_credentials")).find((item) => item.status === "ACTIVE")
    : null;
if (credential) {
  let challenge = challenges.find(
    (item) => item.credential_id === credential.id,
  );
  if (!challenge) {
    await write(
      "challenge_credential",
      [
        credential.id,
        "A newly published revision history changes the attribution of one material artifact and should be weighed against the original finding of independent practice, rubric coverage, and professional authorship.",
        "https://www.w3.org/TR/vc-data-model-2.0/#proofs-signatures",
      ],
      5000000000000000n,
    );
    challenges = await read("get_challenges");
    challenge = challenges.find(
      (item) => item.credential_id === credential.id,
    );
  }
  if (challenge?.status === "OPEN") {
    await write("resolve_challenge", [challenge.id]);
  }
}

const overview = await read("get_overview");
persist({ overview, completedAt: new Date().toISOString() });
console.log(
  json({
    overview,
    acceptedTransactions: transactions.filter((item) => item.succeeded).length,
  }),
);
