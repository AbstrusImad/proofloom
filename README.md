# Proofloom

**A guild-governed protocol for turning demonstrated practice into portable, challengeable, opportunity-bearing credentials.**

[Live application](https://abstrusimad.github.io/proofloom/) · [StudioNet contract](https://explorer-studio.genlayer.com/address/0xcd0eA9F2e9058998d0e7D6C81c520CDEd522bF1C) · [Source](https://github.com/AbstrusImad/proofloom)

![Proofloom's live learning-path archipelago](docs/proofloom-live.png)

## Pattern Legend

A conventional credential records that an institution approved somebody. Proofloom records the more useful story: which community defined competence, what the learner attempted, who observed the practice, which public artifacts support the claim, how independent validators interpreted the whole record, and whether later evidence challenged that conclusion.

The result is not a certificate generator. It is a professional learning market with governance, funded progression, adjudication, portable reputation, and paid opportunity matching. Its reasoning-heavy decisions run through GenLayer intelligent consensus and become inspectable StudioNet state.

| Thread | What it coordinates |
| --- | --- |
| Guilds | Professional domains, charters, mentors, standards, and reputation |
| Learning paths | Bounded goals, portfolios, competency targets, and GEN grant pools |
| Practice proof | Mentor attestations plus project-specific public evidence |
| Credentials | Validator verdict, proficiency, confidence, reasoning, and grants |
| Challenges | Bonded objections and independent credential reassessment |
| Opportunities | Reserved rewards, applications, intelligent fit review, and acceptance |
| Governance | Standard proposals, one-wallet votes, closure, and epochs |

## Warp And Weft

```mermaid
flowchart LR
  G[Guild charter] --> S[Governed standard]
  S --> T[Competency target]
  P[Funded learning path] --> T
  M[Mentor attestation] --> E[Evidence portfolio]
  T --> E
  E --> C{GenLayer consensus}
  C -->|award| K[Portable credential]
  C -->|conditional| R[More practice]
  K --> H{Bonded challenge}
  H -->|reassess| C
  K --> X{Opportunity match}
  O[GEN-backed opportunity] --> X
  X -->|validated fit| A[Accepted professional work]
```

Three kinds of judgment remain distinct:

- **Communities govern the rubric.** Guild members propose and vote standards.
- **People attest observed practice.** Authorized mentors publish accountable statements.
- **Validators interpret evidence.** GenLayer evaluates relevance, authenticity, reproducibility, independence, transferability, and rubric coverage.

That separation prevents one actor from defining competence, supplying all proof, and issuing the final credential alone.

## Live Sample Book

The deployed contract is already populated through **72 accepted StudioNet transactions**. The frontend reads these records directly; it does not ship project fixtures.

| Live state | Count or value |
| --- | ---: |
| Guilds / mentors | 3 / 3 |
| Governed standards | 6 |
| Funded learning paths | 9 |
| Competency targets | 9 |
| Mentor attestations | 6 |
| Evidence records | 7 |
| Credentials | 6 total, 5 active |
| Opportunities / reviewed matches | 4 / 3 |
| Learning pools | 0.3866 GEN |
| Opportunity reserves | 0.29 GEN |
| Claimable value created | 0.1984 GEN |

Examples include an Evidence Systems Practitioner path, a Circular Repair Technician credential, a public-service research fellowship, a resolved bonded reassessment, and an accepted community repair residency.

## Intelligent Knots

Proofloom uses three project-specific consensus operations:

1. `review_competency` compares a target, active guild standard, portfolio evidence, mentor attestations, prior state, and reproducibility signals. It returns a normalized verdict, proficiency, confidence, grant proportion, and reasoning.
2. `resolve_challenge` weighs fresh challenge evidence against the credential's original basis. It can uphold, reassess, or revoke rather than merely echoing a generic LLM answer.
3. `review_match` evaluates whether current credentials durably satisfy a funded opportunity, records gaps, and produces a fit score before acceptance.

Each operation defines its own equivalence rule. Validators must agree on the categorical result while numeric scores remain within a bounded tolerance. This keeps consensus resilient to wording differences without treating materially different outcomes as equivalent.

## Contract Pattern

The intelligent contract contains 32 public methods: 13 reads and 19 state-changing operations.

**Formation and governance**

`register_guild` · `register_mentor` · `create_standard` · `vote_standard` · `close_standard`

**Learning and funding**

`create_path` · `update_portfolio` · `add_target` · `sponsor_path`

**Evidence and credentials**

`attest_practice` · `submit_evidence` · `review_competency` · `challenge_credential` · `resolve_challenge`

**Professional opportunity**

`publish_opportunity` · `apply_opportunity` · `review_match` · `accept_match` · `claim`

**Read surfaces**

`get_overview` · collection reads for every protocol record · `get_profile`

Value follows a pull-payment model. Grants and accepted opportunity rewards increase a claimable balance, and recipients withdraw through `claim`; no external transfer interrupts the state transition that created the entitlement.

## Interface Atelier

The landing follows one continuous thread through four distinct chapters: guild standards, evidence, intelligent consensus, and paid opportunity. Connecting a wallet opens a different spatial model, an archipelago of irregular cloth pieces linked by curved paths.

There is deliberately no sidebar, rectangular dashboard shell, tab strip, or card grid. Learning paths are fabric scraps, credentials are embossed medallions, guilds are blooms, standards form a ballot spiral, and opportunities flow as cut patterns. On mobile the free canvas becomes a vertical braid with a compact shuttle control.

Every write action uses the same visible lifecycle:

`wallet signature → StudioNet submission → validator consensus → accepted result or readable failure`

The animation stops when the receipt resolves, exposes the transaction hash, refreshes contract state, and never collapses a structured contract error into `[object Object]`.

## Run The Loom

Requirements:

- Node.js 22+
- pnpm 9.15+
- Python 3.12+ for contract tests
- A compatible GenLayer wallet for StudioNet writes

```bash
git clone https://github.com/AbstrusImad/proofloom.git
cd proofloom/app
pnpm install
pnpm dev
```

The frontend defaults to the live deployment. To point at another compatible deployment:

```bash
cp .env.example .env.local
```

Set `VITE_CONTRACT_ADDRESS` and `VITE_EXPLORER_URL`; never place a wallet private key in frontend environment variables.

## Verification

```bash
# Contract quality
genvm-lint check contracts/proofloom.py
pytest tests/direct -q

# Production frontend
cd app
pnpm build

# Live StudioNet snapshot
cd ..
pnpm verify:live

# Responsive browser matrix
node scripts/qa-ui.mjs
```

Verified in this repository:

- GenVM lint: 32 public methods recognized
- Direct contract tests: 11 passed
- Production Vite build: passed
- Desktop and mobile: no horizontal overflow
- Five connected protocol areas: passed
- Wallet reconnection after reload: passed
- Browser console and page errors: zero

## StudioNet Deployment

```text
Network:     StudioNet
Chain ID:    61999
Contract:    0xcd0eA9F2e9058998d0e7D6C81c520CDEd522bF1C
Deploy tx:   0xeec6d68a5cf453c658d364b58fcb7b6634f61f46d7b60e255946e8da5939c38a
Deployer:    0x95803126315A05E642D8E46CE1d77eA2199a2A6E
```

Deployment receipts, the 72-transaction seed checkpoint, and a verified live-state snapshot are retained under `deployments/` for reproducibility.

## Repository Map

```text
contracts/proofloom.py       intelligent protocol
tests/direct/                deterministic direct-mode coverage
scripts/deploy-studionet.mjs deployment utility
scripts/seed-studionet.mjs   idempotent live data seeding
scripts/verify-studionet.mjs complete live-state reader
scripts/qa-ui.mjs            responsive interaction audit
app/                         wallet-gated production frontend
deployments/                 StudioNet address, receipts, and state
docs/                        verified interface capture
```

## Care Instructions

Proofloom credentials describe evidence evaluated against a community standard; they do not replace regulated licenses, background checks, employer due diligence, or direct human supervision where those are required. Guild governance should remain transparent, challenge bonds should be proportionate, and evidence should avoid exposing private learner or participant data.

## License

MIT
