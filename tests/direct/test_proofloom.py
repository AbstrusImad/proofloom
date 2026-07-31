import hashlib
import json


CONTRACT = "contracts/proofloom.py"
GEN = 10**18
SOURCE_SNAPSHOT = "deployments/live-state-studionet.json"


def address_hex(address):
    return "0x" + bytes(address).hex()


def deploy(direct_vm, direct_deploy, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    return direct_deploy(CONTRACT, False)


def migration_payload():
    with open(SOURCE_SNAPSHOT, encoding="utf-8") as handle:
        source = json.load(handle)
    state = source["state"]
    data = {
        "source": {
            "network": "StudioNet",
            "contract": source["contractAddress"],
            "accepted_transactions": 72,
            "verified_at": source["verifiedAt"],
        },
        "overview": state["get_overview"],
        "profile": {
            "account": "0x95803126315A05E642D8E46CE1d77eA2199a2A6E",
            "claimable": "198400000000000000",
            "credentials": 6,
            "mentorships": 3,
            "opportunities": 4,
            "paths": 9,
            "reputation": 74,
        },
        "guilds": state["get_guilds"],
        "mentors": state["get_mentors"],
        "standards": state["get_standards"],
        "paths": state["get_paths"],
        "targets": state["get_targets"],
        "attestations": state["get_attestations"],
        "evidence": state["get_evidence"],
        "credentials": state["get_credentials"],
        "challenges": state["get_challenges"],
        "opportunities": state["get_opportunities"],
        "matches": state["get_matches"],
    }
    payload = json.dumps(data, separators=(",", ":"), ensure_ascii=False)
    return data, payload, hashlib.sha256(payload.encode()).hexdigest()


def assert_records_equal(actual_records, expected_records):
    address_fields = {
        "founder",
        "account",
        "author",
        "apprentice",
        "holder",
        "challenger",
        "publisher",
        "applicant",
    }
    numeric_string_fields = {
        "pool",
        "grant_per_credential",
        "grant_pool",
        "bond",
        "reward",
        "reserve",
        "reward_created",
    }
    assert len(actual_records) == len(expected_records)
    for actual, expected in zip(actual_records, expected_records):
        for field, expected_value in expected.items():
            actual_value = getattr(actual, field)
            if field in address_fields:
                assert str(actual_value).lower() == expected_value.lower()
            elif field in numeric_string_fields:
                assert str(int(actual_value)) == str(expected_value)
            elif isinstance(expected_value, int):
                assert int(actual_value) == expected_value
            else:
                assert actual_value == expected_value


def create_path(contract, direct_vm, reserve=GEN):
    direct_vm.value = reserve
    path_id = contract.create_path(
        "G-001",
        "Evidence Systems Practitioner",
        "Build and explain a production-grade evidence workflow with explicit acceptance criteria, reproducible public artifacts, accountable review, and a professional handoff.",
        "https://example.com/portfolios/alex",
        GEN // 5,
    )
    direct_vm.value = 0
    return path_id


def create_target(contract, path_id):
    return contract.add_target(
        path_id,
        "S-0001",
        "Evidence-led delivery",
        "Deliver a bounded public project, document the principal decisions and acceptance criteria, publish reproducible evidence, and explain the final professional handoff.",
    )


def submit_target_evidence(contract, target_id):
    return contract.submit_evidence(
        target_id,
        "The portfolio includes the public source, deployment record, test output, decision log, acceptance criteria, and a reproducible walkthrough connecting the stated objective to the delivered result.",
        "https://example.com/evidence/evidence-systems",
    )


def mock_award(direct_vm, proficiency=88, grant_bps=10000):
    direct_vm.mock_llm(
        r".*professional competency panel.*",
        json.dumps(
            {
                "verdict": "AWARD",
                "proficiency": proficiency,
                "confidence": 93,
                "grant_bps": grant_bps,
                "reasoning": "The public evidence is reproducible, covers the governed standard, and demonstrates independent professional delivery.",
            }
        ),
    )


def award_target(contract, direct_vm, target_id):
    submit_target_evidence(contract, target_id)
    mock_award(direct_vm)
    contract.review_competency(target_id)


def test_genesis_creates_guild_mentor_and_standards(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    overview = contract.get_overview()
    assert overview["guilds"] == 1
    assert overview["mentors"] == 1
    assert overview["standards"] == 2
    assert overview["active_standards"] == 2


def test_migrated_snapshot_preserves_verified_studionet_state(
    direct_vm, direct_deploy, direct_alice
):
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    contract = direct_deploy(CONTRACT, True)
    data, payload, snapshot_hash = migration_payload()
    direct_vm.value = 875000000000000000
    contract.import_snapshot(payload, snapshot_hash)
    direct_vm.value = 0
    overview = contract.get_overview()

    assert overview["guilds"] == 3
    assert overview["mentors"] == 3
    assert overview["standards"] == 6
    assert overview["paths"] == 9
    assert overview["targets"] == 9
    assert overview["credentials"] == 6
    assert overview["opportunities"] == 4
    assert overview["matches"] == 3
    assert overview["migration_source_network"] == "StudioNet"
    assert overview["migration_source_transactions"] == 72
    assert overview["migration_snapshot_hash"] == snapshot_hash
    assert overview["migration_backing"] == "875000000000000000"
    assert overview["migration_complete"] is True
    assert overview["total_learning_pool"] == "386600000000000000"
    profile = contract.get_profile(data["profile"]["account"])
    assert profile["claimable"] == "198400000000000000"
    assert profile["reputation"] == 74

    for getter, key in (
        (contract.get_guilds, "guilds"),
        (contract.get_mentors, "mentors"),
        (contract.get_standards, "standards"),
        (contract.get_paths, "paths"),
        (contract.get_targets, "targets"),
        (contract.get_attestations, "attestations"),
        (contract.get_evidence, "evidence"),
        (contract.get_credentials, "credentials"),
        (contract.get_challenges, "challenges"),
        (contract.get_opportunities, "opportunities"),
        (contract.get_matches, "matches"),
    ):
        assert_records_equal(getter(), data[key])


def test_guild_and_mentor_registration_permissions(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    direct_vm.sender = direct_bob
    guild_id = contract.register_guild(
        "Circular Fabrication Guild",
        "Professional fabrication, repair documentation, material decisions, and accountable workshop handoff",
        "https://example.com/guilds/fabrication",
    )
    mentor_id = contract.register_mentor(
        guild_id,
        "Repair Practice Circle",
        "Material diagnosis, repair planning, workshop evidence, safety review, and professional client handoff",
        "https://example.com/mentors/repair-circle",
        address_hex(direct_bob),
    )
    assert guild_id == "G-002"
    assert mentor_id == "M-0002"
    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Guild authorization required"):
        contract.register_mentor(
            guild_id,
            "Unauthorized Mentor",
            "A sufficiently detailed specialty that should fail because the sender does not control this guild",
            "https://example.com/mentors/unauthorized",
            address_hex(direct_charlie),
        )


def test_path_and_sponsorship_accounting(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    path_id = create_path(contract, direct_vm, GEN // 2)
    direct_vm.sender = direct_bob
    direct_vm.value = GEN // 4
    contract.sponsor_path(path_id)
    direct_vm.value = 0
    path = contract.get_paths()[0]
    assert path.grant_pool == (3 * GEN) // 4
    assert contract.get_overview()["total_learning_pool"] == str(
        (3 * GEN) // 4
    )


def test_target_attestation_and_evidence_permissions(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    path_id = create_path(contract, direct_vm)
    target_id = create_target(contract, path_id)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("Mentor authorization required"):
        contract.attest_practice(
            target_id,
            "M-0001",
            "This statement is sufficiently detailed but must fail because Bob is not the registered mentor account for the selected mentor record and guild.",
            "https://example.com/attestations/unauthorized",
        )
    with direct_vm.expect_revert("Apprentice authorization required"):
        submit_target_evidence(contract, target_id)
    direct_vm.sender = direct_alice
    attestation_id = contract.attest_practice(
        target_id,
        "M-0001",
        "The apprentice repeatedly planned bounded work, explained tradeoffs, incorporated review, published test evidence, and completed a professional handoff during supervised practice.",
        "https://example.com/attestations/practice-1",
    )
    evidence_id = submit_target_evidence(contract, target_id)
    assert attestation_id == "A-0001"
    assert evidence_id == "E-0001"
    assert contract.get_targets()[0].status == "EVIDENCE_SUBMITTED"


def test_competency_award_issues_credential_and_grant(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    path_id = create_path(contract, direct_vm)
    target_id = create_target(contract, path_id)
    contract.attest_practice(
        target_id,
        "M-0001",
        "The apprentice demonstrated repeated independent delivery, documented review changes, published reproducible artifacts, and completed the governed professional handoff.",
        "https://example.com/attestations/award",
    )
    award_target(contract, direct_vm, target_id)
    credential = contract.get_credentials()[0]
    target = contract.get_targets()[0]
    assert credential.status == "ACTIVE"
    assert credential.proficiency == 88
    assert target.status == "CREDENTIALLED"
    assert contract.get_profile(address_hex(direct_alice))["claimable"] == str(
        GEN // 5
    )


def test_more_evidence_does_not_issue_credential(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    path_id = create_path(contract, direct_vm)
    target_id = create_target(contract, path_id)
    submit_target_evidence(contract, target_id)
    direct_vm.mock_llm(
        r".*professional competency panel.*",
        json.dumps(
            {
                "verdict": "MORE_EVIDENCE",
                "proficiency": 54,
                "confidence": 78,
                "grant_bps": 0,
                "reasoning": "The work is promising but lacks a reproducible professional handoff and independent practice evidence.",
            }
        ),
    )
    contract.review_competency(target_id)
    assert contract.get_targets()[0].status == "MORE_EVIDENCE"
    assert contract.get_overview()["credentials"] == 0


def test_bonded_challenge_reopens_credential(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    path_id = create_path(contract, direct_vm)
    target_id = create_target(contract, path_id)
    award_target(contract, direct_vm, target_id)
    direct_vm.sender = direct_bob
    direct_vm.value = GEN // 100
    challenge_id = contract.challenge_credential(
        "C-0001",
        "New revision history shows that a material part of the submitted work predates the apprentice contribution and changes the evidence of independent practice and authorship.",
        "https://example.com/challenges/revision-history",
    )
    direct_vm.value = 0
    direct_vm.mock_llm(
        r".*credential challenge panel.*",
        json.dumps(
            {
                "verdict": "REASSESS",
                "reasoning": "The new authorship evidence is material and requires a fresh competency review.",
            }
        ),
    )
    contract.resolve_challenge(challenge_id)
    assert contract.get_credentials()[0].status == "REASSESSMENT"
    assert contract.get_targets()[0].status == "REASSESSMENT"
    assert contract.get_profile(address_hex(direct_bob))["claimable"] == str(
        GEN // 100
    )


def test_opportunity_match_and_acceptance_create_reward(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    path_id = create_path(contract, direct_vm)
    target_id = create_target(contract, path_id)
    award_target(contract, direct_vm, target_id)
    direct_vm.value = GEN // 2
    opportunity_id = contract.publish_opportunity(
        "G-001",
        "Evidence workflow residency",
        "A bounded professional residency delivering one public evidence workflow, tested acceptance criteria, review documentation, and an accountable handoff to an operating team.",
        "Requires an active evidence-led project delivery credential, strong professional communication, reproducible public artifacts, and demonstrated review practice.",
        "https://example.com/opportunities/evidence-residency",
        GEN // 4,
    )
    direct_vm.value = 0
    match_id = contract.apply_opportunity(opportunity_id, path_id)
    direct_vm.mock_llm(
        r".*professional opportunity matching panel.*",
        json.dumps(
            {
                "verdict": "MATCH",
                "fit_score": 91,
                "gaps": "No material gaps for the bounded residency.",
                "reasoning": "The active credential and portfolio directly cover delivery, evidence, review, and handoff requirements.",
            }
        ),
    )
    contract.review_match(match_id)
    contract.accept_match(match_id)
    assert contract.get_matches()[0].status == "ACCEPTED"
    assert contract.get_opportunities()[0].status == "FILLED"
    assert contract.get_matches()[0].reward_created == GEN // 4


def test_opportunity_reserve_must_cover_reward(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    direct_vm.value = GEN // 10
    with direct_vm.expect_revert("reserve is below reward"):
        contract.publish_opportunity(
            "G-001",
            "Underfunded residency",
            "This otherwise complete opportunity description deliberately requests a reward larger than the supplied reserve in order to exercise accounting validation.",
            "Requires a governed credential, reproducible project evidence, professional review practice, and an accountable delivery handoff.",
            "https://example.com/opportunities/underfunded",
            GEN,
        )
    direct_vm.value = 0


def test_standard_governance_is_unique_and_advances_epoch(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    standard_id = contract.create_standard(
        "G-001",
        "Transparent tool assistance",
        "A portfolio using automated assistance must identify the tools, disclose the material generated contribution, show human verification, and preserve enough evidence to reproduce the final professional decision.",
        "https://example.com/standards/tool-assistance",
    )
    direct_vm.sender = direct_bob
    contract.vote_standard(standard_id, True)
    with direct_vm.expect_revert("Wallet already voted"):
        contract.vote_standard(standard_id, True)
    direct_vm.sender = direct_alice
    contract.close_standard(standard_id)
    assert contract.get_standards()[-1].status == "PASSED"
    assert contract.get_overview()["governance_epoch"] == 2


def test_profile_counts_paths_credentials_and_mentorships(
    direct_vm, direct_deploy, direct_alice
):
    contract = deploy(direct_vm, direct_deploy, direct_alice)
    path_id = create_path(contract, direct_vm)
    target_id = create_target(contract, path_id)
    award_target(contract, direct_vm, target_id)
    profile = contract.get_profile(address_hex(direct_alice))
    assert profile["paths"] == 1
    assert profile["credentials"] == 1
    assert profile["mentorships"] == 1
