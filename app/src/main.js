import {
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CircleDollarSign,
  CircleDot,
  ExternalLink,
  GraduationCap,
  HandCoins,
  Landmark,
  LogOut,
  Orbit,
  Plus,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Vote,
  Wallet,
  X,
  createIcons,
} from "lucide";
import "./styles.css";
import {
  connectWallet,
  contractAddress,
  explorerUrl,
  formatError,
  readContract,
  writeContract,
} from "./services/genlayer";

const root = document.querySelector("#app");
const views = [
  ["paths", "Learning paths", GraduationCap],
  ["credentials", "Credentials", Award],
  ["opportunities", "Opportunities", BriefcaseBusiness],
  ["guilds", "Guilds", Landmark],
  ["governance", "Governance", Vote],
];
const readMap = {
  overview: "get_overview",
  guilds: "get_guilds",
  mentors: "get_mentors",
  standards: "get_standards",
  paths: "get_paths",
  targets: "get_targets",
  attestations: "get_attestations",
  evidence: "get_evidence",
  credentials: "get_credentials",
  challenges: "get_challenges",
  opportunities: "get_opportunities",
  matches: "get_matches",
};
const state = {
  address: "",
  client: null,
  connected: false,
  loading: false,
  view: "paths",
  data: Object.fromEntries(Object.keys(readMap).map((key) => [key, []])),
  selected: "",
  form: null,
  tx: null,
};

const icons = {
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CircleDollarSign,
  CircleDot,
  ExternalLink,
  GraduationCap,
  HandCoins,
  Landmark,
  LogOut,
  Orbit,
  Plus,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Vote,
  Wallet,
  X,
};

const esc = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
const short = (value = "") =>
  value.length > 13 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;
const gen = (wei = 0) => {
  const amount = Number(wei || 0) / 1e18;
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} GEN`;
};
const statusClass = (value = "") =>
  /ACTIVE|PASSED|AWARD|MATCH|ACCEPTED|CREDENTIALLED/.test(value)
    ? "positive"
    : /OPEN|PRACTICING|SUBMITTED|CONDITIONAL|NEAR/.test(value)
      ? "warm"
      : "muted";
const itemBy = (key, id) => state.data[key]?.find((item) => item.id === id);

function refreshIcons() {
  createIcons({ icons, attrs: { "stroke-width": 1.8 } });
}

function walletControl() {
  if (!state.connected) {
    return `<button class="wallet-spool" data-action="connect" aria-label="Connect wallet">
      <i data-lucide="wallet"></i><span>Connect</span>
    </button>`;
  }
  return `<button class="wallet-spool connected" data-action="disconnect" aria-label="Disconnect ${esc(state.address)}">
    <span class="wallet-knot"></span><span>${short(state.address)}</span>
  </button>`;
}

function landing() {
  root.innerHTML = `
    <main class="landing">
      <header class="landing-head">
        <a class="wordmark" href="#top" aria-label="Proofloom home">
          <span class="mark-thread"></span>Proofloom
        </a>
        ${walletControl()}
      </header>

      <svg class="story-thread" viewBox="0 0 1440 3200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M110 0 C100 310 620 320 520 720 S1260 930 1110 1360 S230 1530 340 1990 S1170 2220 1000 2660 S450 2910 720 3200"/>
      </svg>

      <section id="top" class="chapter opening">
        <div class="hero-copy">
          <p class="eyebrow">GENLAYER BRADBURY · PORTABLE PROOF OF PRACTICE</p>
          <h1>Work becomes a credential when the evidence holds.</h1>
          <p class="lead">Build a learning path, gather mentor attestations, submit public evidence, and let decentralized intelligence judge whether your practice meets a guild standard.</p>
          <button class="stitch-cta" data-action="connect"><i data-lucide="circle-dot"></i> Enter the loom</button>
        </div>
        <div class="hero-loom" aria-label="An animated learning path woven through evidence, consensus, and credentials">
          <span class="cloth cloth-a">practice</span>
          <span class="cloth cloth-b">evidence</span>
          <span class="cloth cloth-c">consensus</span>
          <span class="seal"><i data-lucide="badge-check"></i><b>portable</b><small>credential</small></span>
        </div>
        <a class="scroll-cue" href="#guilds">Follow the thread <span>↓</span></a>
      </section>

      <section id="guilds" class="chapter guild-chapter">
        <div class="chapter-number">01</div>
        <div class="guild-ring">
          <span>standards</span><span>mentors</span><span>votes</span>
          <i data-lucide="landmark"></i>
        </div>
        <div class="chapter-copy">
          <p class="eyebrow">GUILDS SET THE PATTERN</p>
          <h2>Competence is governed in public.</h2>
          <p>Professional communities publish explicit rubrics, appoint mentors, and vote standards into force. Every learning target begins with a shared definition of good work.</p>
        </div>
      </section>

      <section class="chapter evidence-chapter">
        <div class="evidence-ribbon">
          <span>PUBLIC SOURCE</span><span>MENTOR ATTESTATION</span>
          <span>REPRODUCIBLE METHOD</span><span>KNOWN LIMITS</span>
        </div>
        <div class="chapter-copy">
          <p class="eyebrow">EVIDENCE ENTERS THE WEAVE</p>
          <h2>Claims face more than a checkbox.</h2>
          <p>GenLayer validators interpret the portfolio, rubric, supervised practice, authenticity, and transferability together. Their result becomes durable protocol state, complete with reasoning and confidence.</p>
        </div>
        <div class="consensus-eye">
          <i data-lucide="sparkles"></i><b>Intelligent consensus</b>
          <small>project-specific judgment</small>
        </div>
      </section>

      <section class="chapter opportunity-chapter">
        <div class="chapter-number">03</div>
        <div class="chapter-copy">
          <p class="eyebrow">PROOF OPENS THE NEXT DOOR</p>
          <h2>Credentials travel into paid opportunity.</h2>
          <p>Sponsors fund learning pools. Publishers reserve GEN for real commissions. Validator-reviewed matching weighs live credentials against requirements before a match can be accepted on-chain.</p>
        </div>
        <div class="orbit-map">
          <span class="orbit-person"><i data-lucide="graduation-cap"></i></span>
          <span class="orbit-proof"><i data-lucide="award"></i></span>
          <span class="orbit-work"><i data-lucide="briefcase-business"></i></span>
          <span class="orbit-fund"><i data-lucide="circle-dollar-sign"></i></span>
        </div>
      </section>

      <section class="chapter closing">
        <span class="closing-seal"><i data-lucide="shield-check"></i></span>
        <h2>Bring your practice.<br/>Leave with proof.</h2>
        <p>Proofloom is live on Bradbury. Connect a wallet to inspect funded paths, governed standards, validator-issued credentials, and active professional opportunities.</p>
        <button class="stitch-cta inverse" data-action="connect"><i data-lucide="wallet"></i> Connect to enter</button>
        <a class="contract-link" href="${explorerUrl}/address/${contractAddress}" target="_blank" rel="noreferrer">Contract ${short(contractAddress)} <i data-lucide="external-link"></i></a>
      </section>
    </main>`;
  refreshIcons();
}

async function loadAll() {
  state.loading = true;
  app();
  const failures = [];
  let successes = 0;
  try {
    const entries = Object.entries(readMap);
    for (let index = 0; index < entries.length; index += 3) {
      const batch = entries.slice(index, index + 3);
      const results = await Promise.allSettled(
        batch.map(async ([key, fn]) => [key, await readContract(fn)]),
      );
      results.forEach((result, resultIndex) => {
        if (result.status === "fulfilled") {
          const [key, value] = result.value;
          state.data[key] = value;
          successes += 1;
        } else {
          failures.push(`${batch[resultIndex][0]}: ${formatError(result.reason)}`);
        }
      });
    }
    if (!state.selected) state.selected = state.data.paths?.[0]?.id || "";
  } finally {
    state.loading = false;
    if (successes === 0 && failures.length) {
      state.tx = { stage: "failed", message: failures[0] };
    }
    app();
  }
}

function app() {
  if (!state.connected) return landing();
  const overview = state.data.overview || {};
  root.innerHTML = `
    <main class="workspace view-${state.view}">
      <svg class="bridge-map" viewBox="0 0 1440 920" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-30 610 C220 490 300 760 535 610 S850 360 1080 520 S1350 700 1490 500"/>
        <path d="M160 80 C310 220 430 140 560 270 S780 470 930 300 S1180 100 1380 250"/>
      </svg>
      <div class="brand-seal">
        <span class="mark-thread"></span><b>Proofloom</b><small>Bradbury</small>
      </div>
      ${walletControl()}
      <button class="sync-knot ${state.loading ? "spinning" : ""}" data-action="refresh" aria-label="Refresh live contract data" title="Refresh live data">
        <i data-lucide="refresh-cw"></i>
      </button>

      <nav class="shuttle-nav" aria-label="Protocol areas">
        ${views
          .map(
            ([key, label]) => `<button class="${state.view === key ? "active" : ""}" data-view="${key}">
              <i data-lucide="${key === "paths" ? "graduation-cap" : key === "credentials" ? "award" : key === "opportunities" ? "briefcase-business" : key === "guilds" ? "landmark" : "vote"}"></i>
              <span>${label}</span>
            </button>`,
          )
          .join("")}
      </nav>

      <section class="protocol-pulse" aria-label="Live protocol totals">
        <span><b>${overview.paths || 0}</b> paths</span>
        <span><b>${overview.active_credentials || 0}</b> credentials</span>
        <span><b>${gen(overview.total_learning_pool)}</b> learning pool</span>
        <span><b>${overview.open_opportunities || 0}</b> open opportunities</span>
      </section>

      <section class="archipelago">
        ${state.loading ? loadingWeave() : renderView()}
      </section>
      ${state.form ? renderPatternSheet() : ""}
      ${state.tx ? renderTransaction() : ""}
    </main>`;
  refreshIcons();
}

function loadingWeave() {
  return `<div class="loading-weave"><span></span><span></span><span></span><span></span><p>Reading the live weave from Bradbury</p></div>`;
}

function renderView() {
  if (state.view === "paths") return renderPaths();
  if (state.view === "credentials") return renderCredentials();
  if (state.view === "opportunities") return renderOpportunities();
  if (state.view === "guilds") return renderGuilds();
  return renderGovernance();
}

function sectionIntro(eyebrow, title, copy, actions = []) {
  return `<div class="island-intro">
    <p>${eyebrow}</p><h1>${title}</h1><span>${copy}</span>
    <div class="thread-actions">${actions
      .map(
        ([label, form, icon = "plus"]) =>
          `<button data-form="${form}"><i data-lucide="${icon}"></i>${label}</button>`,
      )
      .join("")}</div>
  </div>`;
}

function renderPaths() {
  const paths = state.data.paths || [];
  const selected = itemBy("paths", state.selected) || paths[0];
  const targets = state.data.targets?.filter((x) => x.path_id === selected?.id) || [];
  return `${sectionIntro(
    "THE ACTIVE WEAVE",
    "Learning paths",
    "Funded practice moves from guild standards to evidence-backed credentials.",
    [["Begin a path", "create_path", "plus"], ["Sponsor", "sponsor_path", "hand-coins"]],
  )}
    <div class="path-constellation">
      ${paths
        .map(
          (path, index) => `<button class="path-scrap scrap-${(index % 6) + 1} ${selected?.id === path.id ? "selected" : ""}" data-select="${path.id}">
            <small>${esc(path.id)} · ${esc(path.guild_id)}</small>
            <b>${esc(path.title)}</b>
            <span>${path.credential_count} credential${path.credential_count === 1 ? "" : "s"}</span>
            <em>${gen(path.grant_pool)} pooled</em>
          </button>`,
        )
        .join("")}
    </div>
    ${selected ? `<article class="focus-weave">
      <div class="focus-stamp"><span>${esc(selected.id)}</span><b>${selected.average_proficiency || 0}</b><small>proficiency</small></div>
      <div class="focus-copy"><p>${esc(selected.guild_id)} · ${esc(selected.status)}</p><h2>${esc(selected.title)}</h2><span>${esc(selected.goal)}</span></div>
      <div class="target-strand">${targets.map((target) => `<span class="${statusClass(target.status)}"><b>${esc(target.label)}</b><small>${esc(target.status)} · ${target.proficiency}%</small></span>`).join("") || "<span>No targets yet</span>"}</div>
      <div class="focus-actions">
        <button data-form="add_target"><i data-lucide="plus"></i>Add target</button>
        <button data-form="submit_evidence"><i data-lucide="scroll-text"></i>Submit evidence</button>
        <button data-form="review_competency"><i data-lucide="sparkles"></i>Run consensus</button>
        <button data-form="attest_practice"><i data-lucide="user-round-check"></i>Attest practice</button>
      </div>
    </article>` : ""}
    <div class="mentor-spool">
      <div><i data-lucide="user-round-check"></i><b>${state.data.mentors?.length || 0}</b><span>active mentor circles</span></div>
      <button data-form="register_mentor">Register mentor</button>
    </div>`;
}

function renderCredentials() {
  const credentials = state.data.credentials || [];
  const evidenceCount = state.data.evidence?.length || 0;
  return `${sectionIntro(
    "PORTABLE PROOF",
    "Credential passport",
    "Validator reasoning, proficiency, confidence, and challenge history travel together.",
    [["Challenge proof", "challenge_credential", "shield-check"], ["Resolve challenge", "resolve_challenge", "sparkles"], ["Claim GEN", "claim", "circle-dollar-sign"]],
  )}
    <div class="passport-thread">
      ${credentials
        .map(
          (item, i) => `<article class="credential-medallion medallion-${(i % 3) + 1}">
            <div class="medallion-core"><i data-lucide="award"></i><b>${item.proficiency}</b><small>PROFICIENCY</small></div>
            <p>${esc(item.id)} · ${esc(item.standard_id)}</p>
            <h2>${esc(item.title)}</h2>
            <span class="state-stitch ${statusClass(item.status)}">${esc(item.status)}</span>
            <details><summary>Validator reasoning</summary><p>${esc(item.reasoning)}</p></details>
          </article>`,
        )
        .join("")}
    </div>
    <aside class="proof-tally"><b>${evidenceCount}</b><span>public evidence records</span><i data-lucide="scroll-text"></i></aside>
    <div class="challenge-knot">
      <p>Accountability strand</p>
      <b>${state.data.challenges?.length || 0} challenge resolved · ${state.data.overview?.open_challenges || 0} open</b>
      <span>Bonded challenges trigger an independent reassessment through GenLayer consensus.</span>
    </div>`;
}

function renderOpportunities() {
  const opportunities = state.data.opportunities || [];
  const matches = state.data.matches || [];
  return `${sectionIntro(
    "FROM PROOF TO PRACTICE",
    "Opportunity exchange",
    "Publishers reserve GEN; credential holders enter validator-reviewed professional matching.",
    [["Publish work", "publish_opportunity", "briefcase-business"], ["Apply", "apply_opportunity", "orbit"], ["Review match", "review_match", "sparkles"], ["Accept match", "accept_match", "badge-check"]],
  )}
    <div class="opportunity-river">
      ${opportunities
        .map((item, i) => {
          const linked = matches.filter((match) => match.opportunity_id === item.id);
          return `<article class="opportunity-leaf leaf-${(i % 4) + 1}">
            <p>${esc(item.id)} · ${esc(item.guild_id)}</p><h2>${esc(item.title)}</h2>
            <span>${esc(item.description)}</span>
            <div><b>${gen(item.reward)}</b><em class="${statusClass(item.status)}">${esc(item.status)}</em></div>
            ${linked.map((match) => `<small>${esc(match.id)} · ${esc(match.verdict)} · ${match.fit_score}% fit</small>`).join("")}
          </article>`;
        })
        .join("")}
    </div>
    <div class="match-compass"><i data-lucide="orbit"></i><b>${matches.length}</b><span>validator-reviewed matches</span></div>`;
}

function renderGuilds() {
  const guilds = state.data.guilds || [];
  return `${sectionIntro(
    "COMMUNITIES OF PRACTICE",
    "Guild commons",
    "Guilds hold the standards, mentors, reputation, and learning paths of a professional domain.",
    [["Form a guild", "register_guild", "landmark"], ["Register mentor", "register_mentor", "user-round-check"]],
  )}
    <div class="guild-garden">
      ${guilds
        .map((guild, i) => `<article class="guild-bloom bloom-${i + 1}">
          <span class="bloom-icon"><i data-lucide="landmark"></i></span>
          <p>${esc(guild.id)} · reputation ${guild.reputation}</p>
          <h2>${esc(guild.name)}</h2><span>${esc(guild.domain)}</span>
          <div><b>${guild.path_count}</b> paths · <b>${guild.standard_count}</b> standards · <b>${guild.mentor_count}</b> mentor</div>
          <a href="${esc(guild.charter_url)}" target="_blank" rel="noreferrer">Read charter <i data-lucide="external-link"></i></a>
        </article>`)
        .join("")}
    </div>`;
}

function renderGovernance() {
  const standards = state.data.standards || [];
  return `${sectionIntro(
    "THE GOVERNED PATTERN",
    "Standards assembly",
    "Members propose, vote, and close the definitions that validator-issued credentials must satisfy.",
    [["Propose standard", "create_standard", "scroll-text"], ["Cast vote", "vote_standard", "vote"], ["Close ballot", "close_standard", "badge-check"]],
  )}
    <div class="ballot-spiral">
      ${standards
        .map(
          (item, i) => `<article class="ballot-petal petal-${(i % 6) + 1}">
            <p>${esc(item.id)} · epoch ${item.epoch}</p><h2>${esc(item.title)}</h2>
            <span>${esc(item.description)}</span>
            <footer><b>${item.yes} yes</b><b>${item.no} no</b><em class="${statusClass(item.status)}">${esc(item.status)}</em></footer>
          </article>`,
        )
        .join("")}
    </div>
    <aside class="epoch-seal"><small>GOVERNANCE</small><b>${state.data.overview?.governance_epoch || 0}</b><span>current epoch</span></aside>`;
}

const forms = {
  register_guild: {
    title: "Form a guild",
    submit: "Register guild",
    fields: [["name", "Guild name"], ["domain", "Professional domain", "textarea"], ["charter_url", "Public charter URL", "url"]],
  },
  register_mentor: {
    title: "Register a mentor",
    submit: "Add mentor",
    fields: [["guild_id", "Guild ID"], ["name", "Mentor name"], ["specialty", "Specialty and practice scope", "textarea"], ["profile_url", "Public profile URL", "url"], ["account", "Mentor wallet"]],
  },
  create_standard: {
    title: "Propose a standard",
    submit: "Open ballot",
    fields: [["guild_id", "Guild ID"], ["title", "Standard title"], ["description", "Acceptance standard", "textarea"], ["rubric_url", "Public rubric URL", "url"]],
  },
  vote_standard: { title: "Cast a standards vote", submit: "Record vote", fields: [["standard_id", "Standard ID"], ["support", "Vote", "select", [["true", "Support"], ["false", "Oppose"]]]] },
  close_standard: { title: "Close a standards ballot", submit: "Close ballot", fields: [["standard_id", "Standard ID"]] },
  create_path: {
    title: "Begin a learning path",
    submit: "Create funded path",
    value: true,
    fields: [["guild_id", "Guild ID"], ["title", "Path title"], ["goal", "Learning goal and outcome", "textarea"], ["portfolio_url", "Public portfolio URL", "url"], ["grant_per_credential", "Grant per credential (GEN)", "number"], ["value", "Initial learning pool (GEN)", "number"]],
  },
  sponsor_path: { title: "Sponsor a learning path", submit: "Fund path", value: true, fields: [["path_id", "Path ID"], ["value", "Sponsorship (GEN)", "number"]] },
  add_target: { title: "Add a competency target", submit: "Add target", fields: [["path_id", "Path ID"], ["standard_id", "Passed standard ID"], ["label", "Target label"], ["objective", "Observable objective", "textarea"]] },
  attest_practice: { title: "Attest supervised practice", submit: "Publish attestation", fields: [["target_id", "Target ID"], ["mentor_id", "Mentor ID"], ["statement", "Detailed practice statement", "textarea"], ["evidence_url", "Public evidence URL", "url"]] },
  submit_evidence: { title: "Submit portfolio evidence", submit: "Publish evidence", fields: [["target_id", "Target ID"], ["summary", "Evidence, method, limits, and handoff", "textarea"], ["evidence_url", "Public evidence URL", "url"]] },
  review_competency: { title: "Run competency consensus", submit: "Ask validators", intelligent: true, fields: [["target_id", "Target ID"]] },
  challenge_credential: { title: "Open a bonded challenge", submit: "Challenge credential", value: true, fields: [["credential_id", "Credential ID"], ["grounds", "Project-specific grounds", "textarea"], ["evidence_url", "New public evidence URL", "url"], ["value", "Challenge bond (GEN)", "number"]] },
  resolve_challenge: { title: "Resolve a credential challenge", submit: "Run reassessment", intelligent: true, fields: [["challenge_id", "Challenge ID"]] },
  publish_opportunity: { title: "Publish a funded opportunity", submit: "Reserve and publish", value: true, fields: [["guild_id", "Guild ID"], ["title", "Opportunity title"], ["description", "Bounded professional work", "textarea"], ["requirements", "Credential and evidence requirements", "textarea"], ["public_url", "Public brief URL", "url"], ["reward", "Reward (GEN)", "number"], ["value", "Total reserve (GEN)", "number"]] },
  apply_opportunity: { title: "Enter opportunity matching", submit: "Submit application", fields: [["opportunity_id", "Opportunity ID"], ["path_id", "Learning path ID"]] },
  review_match: { title: "Run matching consensus", submit: "Ask validators", intelligent: true, fields: [["match_id", "Match ID"]] },
  accept_match: { title: "Accept a validated match", submit: "Accept match", fields: [["match_id", "Match ID"]] },
  claim: { title: "Claim available GEN", submit: "Claim balance", fields: [] },
};

function suggested(field) {
  const selectedPath = itemBy("paths", state.selected);
  const target = state.data.targets?.find((x) => x.path_id === selectedPath?.id && !["CREDENTIALLED", "REVOKED"].includes(x.status));
  const map = {
    path_id: selectedPath?.id,
    guild_id: selectedPath?.guild_id,
    target_id: target?.id || state.data.targets?.find((x) => x.status === "PRACTICING")?.id,
    credential_id: state.data.credentials?.find((x) => ["ACTIVE", "CONDITIONAL"].includes(x.status))?.id,
    challenge_id: state.data.challenges?.find((x) => x.status === "OPEN")?.id,
    standard_id: state.data.standards?.find((x) => x.status === "OPEN")?.id,
    opportunity_id: state.data.opportunities?.find((x) => x.status === "OPEN")?.id,
    match_id: state.data.matches?.find((x) => !["ACCEPTED", "REJECTED"].includes(x.status))?.id,
    account: state.address,
  };
  return map[field] || "";
}

function renderPatternSheet() {
  const config = forms[state.form];
  return `<div class="pattern-backdrop" data-action="close-form">
    <form class="pattern-sheet" id="action-form" data-function="${state.form}">
      <button type="button" class="pattern-close" data-action="close-form" aria-label="Close"><i data-lucide="x"></i></button>
      <p>ON-CHAIN ACTION</p><h2>${config.title}</h2>
      ${config.intelligent ? `<div class="intelligence-note"><i data-lucide="sparkles"></i><span>GenLayer validators will evaluate this action. Their consensus and reasoning will be written on-chain.</span></div>` : ""}
      <div class="pattern-fields">
        ${config.fields.map(([name, label, type = "text", options = []]) => fieldMarkup(name, label, type, options)).join("")}
      </div>
      <button class="pattern-submit" type="submit"><span>${config.submit}</span><i data-lucide="${config.intelligent ? "sparkles" : "circle-dot"}"></i></button>
    </form>
  </div>`;
}

function fieldMarkup(name, label, type, options) {
  const value = suggested(name);
  if (type === "textarea") return `<label><span>${label}</span><textarea name="${name}" required>${esc(value)}</textarea></label>`;
  if (type === "select") return `<label><span>${label}</span><select name="${name}" required>${options.map(([key, text]) => `<option value="${key}">${text}</option>`).join("")}</select></label>`;
  return `<label><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${type === "number" ? 'min="0" step="0.001"' : ""} required /></label>`;
}

function renderTransaction() {
  const tx = state.tx;
  const active = ["signature", "consensus"].includes(tx.stage);
  const labels = {
    signature: "Confirm in your wallet",
    consensus: "Validators are weaving consensus",
    accepted: "The transaction is accepted",
    failed: "The thread could not be completed",
  };
  return `<div class="tx-overlay">
    <section class="tx-loom ${tx.stage}">
      ${!active ? `<button data-action="close-tx" aria-label="Close result"><i data-lucide="x"></i></button>` : ""}
      <div class="loop-animation" aria-hidden="true"><span></span><span></span><span></span><span></span><i></i></div>
      <p>${tx.stage === "consensus" ? "GENLAYER INTELLIGENT CONSENSUS" : "BRADBURY TRANSACTION"}</p>
      <h2>${labels[tx.stage]}</h2>
      <span>${tx.message || (tx.stage === "signature" ? "Awaiting signature before the thread enters Bradbury." : tx.stage === "consensus" ? "Multiple validators are interpreting the action. This can take a moment." : "Live protocol state has been refreshed.")}</span>
      ${tx.hash ? `<a href="${explorerUrl}/transactions/${tx.hash}" target="_blank" rel="noreferrer">${short(tx.hash)} <i data-lucide="external-link"></i></a>` : ""}
    </section>
  </div>`;
}

function toWei(value) {
  const [whole = "0", fraction = ""] = String(value || "0").split(".");
  return BigInt(whole || 0) * 10n ** 18n + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}

async function submitAction(form) {
  const fn = form.dataset.function;
  const config = forms[fn];
  const raw = Object.fromEntries(new FormData(form));
  const value = config.value ? toWei(raw.value) : undefined;
  const args = config.fields
    .filter(([name]) => name !== "value")
    .map(([name, , type]) => {
      if (name === "grant_per_credential" || name === "reward") return toWei(raw[name]);
      if (type === "select") return raw[name] === "true";
      return raw[name];
    });
  state.form = null;
  state.tx = { stage: "signature", message: "" };
  app();
  try {
    const result = await writeContract({
      client: state.client,
      functionName: fn,
      args,
      value,
      onStage: (stage, hash) => {
        state.tx = { stage, hash, message: "" };
        app();
      },
    });
    state.tx = { stage: "accepted", hash: result.hash, message: "The result is now part of Proofloom's live state." };
    app();
    await loadAll();
    state.tx = { stage: "accepted", hash: result.hash, message: "The result is now visible in the refreshed protocol state." };
    app();
  } catch (error) {
    state.tx = { stage: "failed", message: formatError(error) };
    app();
  }
}

async function connect({ silent = false } = {}) {
  try {
    const session = await connectWallet({ silent });
    if (!session) {
      if (!silent) throw new Error("Wallet connection was not approved.");
      return;
    }
    state.address = session.address;
    state.client = session.client;
    state.connected = true;
    localStorage.setItem("proofloom.walletConnected", "true");
    app();
    await loadAll();
  } catch (error) {
    if (!silent) {
      state.tx = { stage: "failed", message: formatError(error) };
      landing();
      const message = document.createElement("div");
      message.className = "landing-error";
      message.textContent = formatError(error);
      root.append(message);
    }
  }
}

function disconnect() {
  localStorage.removeItem("proofloom.walletConnected");
  state.address = "";
  state.client = null;
  state.connected = false;
  state.tx = null;
  landing();
}

root.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-select]");
  if (!target) return;
  if (target.dataset.action === "connect") return connect();
  if (target.dataset.action === "disconnect") return disconnect();
  if (target.dataset.action === "refresh") return loadAll();
  if (target.dataset.action === "close-form") {
    if (event.target === target || target.matches("button")) {
      state.form = null;
      app();
    }
    return;
  }
  if (target.dataset.action === "close-tx") {
    state.tx = null;
    app();
    return;
  }
  if (target.dataset.view) {
    state.view = target.dataset.view;
    app();
    return;
  }
  if (target.dataset.select) {
    state.selected = target.dataset.select;
    app();
    return;
  }
  if (target.dataset.form) {
    state.form = target.dataset.form;
    app();
  }
});

root.addEventListener("submit", (event) => {
  if (event.target.matches("#action-form")) {
    event.preventDefault();
    submitAction(event.target);
  }
});

window.ethereum?.on?.("accountsChanged", (accounts) => {
  if (!accounts?.length) disconnect();
  else if (state.connected && accounts[0].toLowerCase() !== state.address.toLowerCase()) connect({ silent: true });
});

landing();
if (localStorage.getItem("proofloom.walletConnected") === "true") {
  connect({ silent: true });
}
