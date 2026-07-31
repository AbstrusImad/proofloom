const sameAddress = (left = "", right = "") =>
  String(left).toLowerCase() === String(right).toLowerCase();

const find = (items, id) => items?.find((item) => item.id === id);
const positiveWei = (value) => {
  try {
    const [whole = "0", fraction = ""] = String(value || "0").split(".");
    return (
      BigInt(whole || 0) * 10n ** 18n +
      BigInt((fraction + "0".repeat(18)).slice(0, 18))
    );
  } catch {
    return 0n;
  }
};

const minimumLengths = {
  name: 4,
  domain: 40,
  specialty: 40,
  title: 5,
  description: 100,
  goal: 80,
  label: 4,
  objective: 60,
  statement: 100,
  summary: 120,
  grounds: 100,
  requirements: 100,
};

function validateCommon(raw) {
  for (const [field, minimum] of Object.entries(minimumLengths)) {
    if (field in raw && String(raw[field]).trim().length < minimum) {
      return `${field.replaceAll("_", " ")} must contain at least ${minimum} characters.`;
    }
  }
  for (const [field, value] of Object.entries(raw)) {
    if (field.endsWith("_url") && !/^https:\/\/\S+$/i.test(String(value))) {
      return `${field.replaceAll("_", " ")} must be a public HTTPS URL.`;
    }
  }
  if (
    raw.account &&
    !/^0x[0-9a-f]{40}$/i.test(String(raw.account).trim())
  ) {
    return "Mentor wallet must be a valid 0x address.";
  }
  return "";
}

const rules = {
  register_mentor({ raw, data, address }) {
    const guild = find(data.guilds, raw.guild_id);
    if (!guild) return "Choose an existing guild.";
    if (!sameAddress(guild.founder, address)) {
      return "Only the guild founder can register a mentor for this guild.";
    }
  },
  create_standard({ raw, data, address }) {
    const guild = find(data.guilds, raw.guild_id);
    if (!guild) return "Choose an existing guild.";
    if (!sameAddress(guild.founder, address)) {
      return "Only the guild founder can propose a standard for this guild.";
    }
  },
  vote_standard({ raw, data }) {
    const standard = find(data.standards, raw.standard_id);
    if (!standard || standard.status !== "OPEN") {
      return "Choose an open standard ballot.";
    }
  },
  close_standard({ raw, data, address }) {
    const standard = find(data.standards, raw.standard_id);
    if (!standard || standard.status !== "OPEN") {
      return "Choose an open standard ballot.";
    }
    const guild = find(data.guilds, standard.guild_id);
    if (!sameAddress(guild?.founder, address)) {
      return "Only the guild founder can close this ballot.";
    }
    if (Number(standard.yes || 0) + Number(standard.no || 0) === 0) {
      return "This ballot needs at least one vote before it can be closed.";
    }
  },
  create_path({ raw, data }) {
    const guild = find(data.guilds, raw.guild_id);
    if (!guild || guild.status !== "ACTIVE") {
      return "Choose an active guild.";
    }
  },
  sponsor_path({ raw, data }) {
    const path = find(data.paths, raw.path_id);
    if (!path || path.status === "CLOSED") {
      return "Choose an open learning path.";
    }
    if (positiveWei(raw.value) <= 0n) {
      return "Enter a positive GEN sponsorship.";
    }
  },
  add_target({ raw, data, address }) {
    const path = find(data.paths, raw.path_id);
    if (!path) return "Choose an existing learning path.";
    if (!sameAddress(path.apprentice, address)) {
      return "Only the path owner can add a competency target.";
    }
    const standard = find(data.standards, raw.standard_id);
    if (
      !standard ||
      standard.status !== "PASSED" ||
      standard.guild_id !== path.guild_id
    ) {
      return "Choose a passed standard governed by the path's guild.";
    }
  },
  attest_practice({ raw, data, address }) {
    const target = find(data.targets, raw.target_id);
    const path = find(data.paths, target?.path_id);
    const mentor = find(data.mentors, raw.mentor_id);
    if (!target || !path) return "Choose an existing competency target.";
    if (["CREDENTIALLED", "REVOKED"].includes(target.status)) {
      return "This target no longer accepts mentor attestations.";
    }
    if (!mentor || !sameAddress(mentor.account, address)) {
      return "Choose a mentor controlled by the connected wallet.";
    }
    if (mentor.status !== "ACTIVE" || mentor.guild_id !== path.guild_id) {
      return "The mentor must be active in the target's guild.";
    }
  },
  submit_evidence({ raw, data, address }) {
    const target = find(data.targets, raw.target_id);
    const path = find(data.paths, target?.path_id);
    if (!target || !path) return "Choose an existing competency target.";
    if (!sameAddress(path.apprentice, address)) {
      return "Only the path owner can submit evidence for this target.";
    }
    if (
      !["PRACTICING", "ATTESTED", "MORE_EVIDENCE", "REASSESSMENT"].includes(
        target.status,
      )
    ) {
      return "This target does not currently accept new evidence.";
    }
  },
  review_competency({ raw, data }) {
    const target = find(data.targets, raw.target_id);
    if (!target) return "Choose an existing competency target.";
    if (!["EVIDENCE_SUBMITTED", "REASSESSMENT"].includes(target.status)) {
      return `Target ${target.id} is ${target.status}. Submit evidence before running competency consensus.`;
    }
  },
  challenge_credential({ raw, data }) {
    const credential = find(data.credentials, raw.credential_id);
    if (
      !credential ||
      !["ACTIVE", "CONDITIONAL"].includes(credential.status)
    ) {
      return "Choose an active or conditional credential.";
    }
    if (positiveWei(raw.value) <= 0n) {
      return "Enter a positive GEN challenge bond.";
    }
  },
  resolve_challenge({ raw, data }) {
    const challenge = find(data.challenges, raw.challenge_id);
    if (!challenge || challenge.status !== "OPEN") {
      return "Choose an open credential challenge.";
    }
  },
  publish_opportunity({ raw, data }) {
    if (!find(data.guilds, raw.guild_id)) {
      return "Choose an existing guild.";
    }
    if (positiveWei(raw.reward) > positiveWei(raw.value)) {
      return "The total reserve must cover the advertised reward.";
    }
  },
  apply_opportunity({ raw, data, address }) {
    const opportunity = find(data.opportunities, raw.opportunity_id);
    const path = find(data.paths, raw.path_id);
    if (!opportunity || opportunity.status !== "OPEN") {
      return "Choose an open opportunity.";
    }
    if (!path || !sameAddress(path.apprentice, address)) {
      return "Choose a learning path controlled by the connected wallet.";
    }
    if (path.guild_id !== opportunity.guild_id) {
      return "The learning path and opportunity must belong to the same guild.";
    }
  },
  review_match({ raw, data }) {
    const match = find(data.matches, raw.match_id);
    if (!match || !["PENDING", "REASSESSMENT"].includes(match.status)) {
      return "Choose a pending or reassessment match.";
    }
  },
  accept_match({ raw, data, address }) {
    const match = find(data.matches, raw.match_id);
    const opportunity = find(data.opportunities, match?.opportunity_id);
    if (!match || match.status !== "MATCHED") {
      return "Choose a validator-approved match.";
    }
    if (!opportunity || opportunity.status !== "OPEN") {
      return "The linked opportunity is no longer open.";
    }
    if (!sameAddress(opportunity.publisher, address)) {
      return "Only the opportunity publisher can accept this match.";
    }
  },
  claim({ data }) {
    if (BigInt(data.profile?.claimable || 0) === 0n) {
      return "The connected wallet has no claimable GEN.";
    }
  },
};

export function validateAction(functionName, raw, data, address) {
  return (
    validateCommon(raw) ||
    rules[functionName]?.({ raw, data, address }) ||
    ""
  );
}

export { sameAddress };
