# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from dataclasses import dataclass
from genlayer import *

EXPECTED = "[EXPECTED]"
LLM_ERROR = "[LLM_ERROR]"


@allow_storage
@dataclass
class Guild:
    id: str
    founder: Address
    name: str
    domain: str
    charter_url: str
    reputation: u32
    mentor_count: u32
    path_count: u32
    standard_count: u32
    pool: u256
    status: str


@allow_storage
@dataclass
class Mentor:
    id: str
    account: Address
    guild_id: str
    name: str
    specialty: str
    profile_url: str
    reputation: u32
    attestations: u32
    successful_reviews: u32
    status: str


@allow_storage
@dataclass
class CompetencyStandard:
    id: str
    guild_id: str
    author: Address
    title: str
    description: str
    rubric_url: str
    status: str
    yes: u32
    no: u32
    epoch: u32


@allow_storage
@dataclass
class LearningPath:
    id: str
    apprentice: Address
    guild_id: str
    title: str
    goal: str
    portfolio_url: str
    status: str
    target_count: u32
    credential_count: u32
    evidence_count: u32
    challenge_count: u32
    grant_per_credential: u256
    grant_pool: u256
    average_proficiency: u32


@allow_storage
@dataclass
class SkillTarget:
    id: str
    path_id: str
    standard_id: str
    label: str
    objective: str
    status: str
    evidence_id: str
    credential_id: str
    proficiency: u32
    confidence: u32
    verdict: str
    reasoning: str


@allow_storage
@dataclass
class PracticeAttestation:
    id: str
    path_id: str
    target_id: str
    mentor_id: str
    statement: str
    evidence_url: str
    status: str


@allow_storage
@dataclass
class PortfolioEvidence:
    id: str
    path_id: str
    target_id: str
    author: Address
    summary: str
    evidence_url: str
    status: str


@allow_storage
@dataclass
class Credential:
    id: str
    path_id: str
    target_id: str
    standard_id: str
    holder: Address
    title: str
    proficiency: u32
    confidence: u32
    status: str
    reasoning: str
    challenge_count: u32


@allow_storage
@dataclass
class CredentialChallenge:
    id: str
    credential_id: str
    challenger: Address
    grounds: str
    evidence_url: str
    bond: u256
    status: str
    verdict: str
    reasoning: str


@allow_storage
@dataclass
class Opportunity:
    id: str
    publisher: Address
    guild_id: str
    title: str
    description: str
    requirements: str
    public_url: str
    reward: u256
    reserve: u256
    status: str
    application_count: u32
    accepted_match_id: str


@allow_storage
@dataclass
class OpportunityMatch:
    id: str
    opportunity_id: str
    path_id: str
    applicant: Address
    status: str
    verdict: str
    fit_score: u32
    gaps: str
    reasoning: str
    reward_created: u256


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


class Proofloom(gl.Contract):
    owner: Address
    guild_ids: DynArray[str]
    guilds: TreeMap[str, Guild]
    mentor_ids: DynArray[str]
    mentors: TreeMap[str, Mentor]
    standard_ids: DynArray[str]
    standards: TreeMap[str, CompetencyStandard]
    path_ids: DynArray[str]
    paths: TreeMap[str, LearningPath]
    target_ids: DynArray[str]
    targets: TreeMap[str, SkillTarget]
    attestation_ids: DynArray[str]
    attestations: TreeMap[str, PracticeAttestation]
    evidence_ids: DynArray[str]
    evidence: TreeMap[str, PortfolioEvidence]
    credential_ids: DynArray[str]
    credentials: TreeMap[str, Credential]
    challenge_ids: DynArray[str]
    challenges: TreeMap[str, CredentialChallenge]
    opportunity_ids: DynArray[str]
    opportunities: TreeMap[str, Opportunity]
    match_ids: DynArray[str]
    matches: TreeMap[str, OpportunityMatch]
    standard_votes: TreeMap[str, bool]
    path_sponsorships: TreeMap[str, u256]
    claimable: TreeMap[Address, u256]
    account_reputation: TreeMap[Address, u32]
    total_learning_pool: u256
    total_opportunity_reserve: u256
    total_claimable_created: u256
    governance_epoch: u32
    migration_source_network: str
    migration_source_contract: str
    migration_source_transactions: u32

    def __init__(self, migrate_snapshot: bool):
        self.owner = gl.message.sender_address
        self.guild_ids = []
        self.mentor_ids = []
        self.standard_ids = []
        self.path_ids = []
        self.target_ids = []
        self.attestation_ids = []
        self.evidence_ids = []
        self.credential_ids = []
        self.challenge_ids = []
        self.opportunity_ids = []
        self.match_ids = []
        self.total_learning_pool = u256(0)
        self.total_opportunity_reserve = u256(0)
        self.total_claimable_created = u256(0)
        self.governance_epoch = u32(1)
        self.migration_source_network = ""
        self.migration_source_contract = ""
        self.migration_source_transactions = u32(0)

        if migrate_snapshot:
            self._load_migrated_snapshot()
            return

        guild_id = self._register_guild(
            self.owner,
            "Open Craft Guild",
            "Portable evidence standards for practical digital and technical work",
            "https://www.w3.org/",
        )
        self._register_mentor(
            self.owner,
            guild_id,
            "Foundry Mentor Circle",
            "Project practice, review habits, evidence quality, and professional handoff",
            "https://www.w3.org/",
        )
        self._create_standard(
            self.owner,
            guild_id,
            "Evidence-led project delivery",
            "Demonstrate a bounded project outcome, explain key decisions, publish reproducible evidence, and document a professional handoff against explicit acceptance criteria.",
            "https://www.w3.org/TR/vc-data-model-2.0/",
            "PASSED",
        )
        self._create_standard(
            self.owner,
            guild_id,
            "Collaborative review practice",
            "Demonstrate constructive review, traceable revisions, accountable communication, and a resolved contribution to shared work using public evidence.",
            "https://www.w3.org/TR/vc-data-model-2.0/",
            "PASSED",
        )

    # MIGRATION_SNAPSHOT_START
    def _load_migrated_snapshot(self):
        self.migration_source_network = "StudioNet"
        self.migration_source_contract = "0xcd0eA9F2e9058998d0e7D6C81c520CDEd522bF1C"
        self.migration_source_transactions = u32(72)

        self.guild_ids.append("G-001"); self.guilds["G-001"] = Guild("G-001", self.owner, "Open Craft Guild", "Portable evidence standards for practical digital and...", "https://www.w3.org/", u32(72), u32(1), u32(4), u32(3), u256(0), "ACTIVE")
        self.guild_ids.append("G-002"); self.guilds["G-002"] = Guild("G-002", self.owner, "Human Systems Guild", "Service design, operational research, facilitation, p...", "https://www.w3.org/", u32(72), u32(1), u32(3), u32(2), u256(0), "ACTIVE")
        self.guild_ids.append("G-003"); self.guilds["G-003"] = Guild("G-003", self.owner, "Circular Fabrication Guild", "Repair diagnosis, material stewardship, fabrication p...", "https://www.w3.org/", u32(72), u32(1), u32(2), u32(1), u256(0), "ACTIVE")
        self.mentor_ids.append("M-0001"); self.mentors["M-0001"] = Mentor("M-0001", self.owner, "G-001", "Foundry Mentor Circle", "Project practice, review habits, evidence quality, an...", "https://www.w3.org/", u32(78), u32(3), u32(4), "ACTIVE")
        self.mentor_ids.append("M-0002"); self.mentors["M-0002"] = Mentor("M-0002", self.owner, "G-002", "Service Evidence Studio", "Field research synthesis, facilitation records, servi...", "https://www.w3.org/", u32(72), u32(2), u32(1), "ACTIVE")
        self.mentor_ids.append("M-0003"); self.mentors["M-0003"] = Mentor("M-0003", self.owner, "G-003", "Repair Practice Circle", "Material diagnosis, safe workshop practice, repair do...", "https://www.w3.org/", u32(72), u32(1), u32(1), "ACTIVE")
        self.standard_ids.append("S-0001"); self.standards["S-0001"] = CompetencyStandard("S-0001", "G-001", self.owner, "Evidence-led project delivery", "Demonstrate a bounded project outcome, explain key de...", "https://www.w3.org/", "PASSED", u32(0), u32(0), u32(1))
        self.standard_ids.append("S-0002"); self.standards["S-0002"] = CompetencyStandard("S-0002", "G-001", self.owner, "Collaborative review practice", "Demonstrate constructive review, traceable revisions,...", "https://www.w3.org/", "PASSED", u32(0), u32(0), u32(1))
        self.standard_ids.append("S-0003"); self.standards["S-0003"] = CompetencyStandard("S-0003", "G-002", self.owner, "Public service research synthesis", "Demonstrate an ethical research question, traceable f...", "https://www.w3.org/", "PASSED", u32(1), u32(0), u32(1))
        self.standard_ids.append("S-0004"); self.standards["S-0004"] = CompetencyStandard("S-0004", "G-002", self.owner, "Facilitated decision practice", "Demonstrate an inclusive decision process, accessible...", "https://www.w3.org/", "PASSED", u32(1), u32(0), u32(1))
        self.standard_ids.append("S-0005"); self.standards["S-0005"] = CompetencyStandard("S-0005", "G-003", self.owner, "Repair diagnosis and safe handoff", "Demonstrate fault isolation, material and safety reas...", "https://www.w3.org/", "PASSED", u32(1), u32(0), u32(1))
        self.standard_ids.append("S-0006"); self.standards["S-0006"] = CompetencyStandard("S-0006", "G-001", self.owner, "Transparent assisted practice", "A portfolio using automated assistance must identify...", "https://www.w3.org/", "OPEN", u32(0), u32(1), u32(1))
        self.path_ids.append("P-0001"); self.paths["P-0001"] = LearningPath("P-0001", self.owner, "G-001", "Evidence Systems Practitioner", "Build a production-grade evidence workflow with expli...", "https://www.w3.org/", "OPEN", u32(1), u32(1), u32(1), u32(0), u256(30000000000000000), u256(45000000000000000), u32(95))
        self.path_ids.append("P-0002"); self.paths["P-0002"] = LearningPath("P-0002", self.owner, "G-001", "Collaborative Review Steward", "Develop repeatable collaborative review practice thro...", "https://www.w3.org/", "OPEN", u32(1), u32(2), u32(2), u32(1), u256(30000000000000000), u256(0), u32(92))
        self.path_ids.append("P-0003"); self.paths["P-0003"] = LearningPath("P-0003", self.owner, "G-002", "Public Service Researcher", "Turn ethical field observations into a traceable synt...", "https://www.w3.org/", "OPEN", u32(1), u32(0), u32(1), u32(0), u256(30000000000000000), u256(75000000000000000), u32(0))
        self.path_ids.append("P-0004"); self.paths["P-0004"] = LearningPath("P-0004", self.owner, "G-002", "Decision Facilitation Practitioner", "Design and facilitate an inclusive decision process w...", "https://www.w3.org/", "OPEN", u32(1), u32(1), u32(1), u32(0), u256(30000000000000000), u256(20000000000000000), u32(95))
        self.path_ids.append("P-0005"); self.paths["P-0005"] = LearningPath("P-0005", self.owner, "G-003", "Circular Repair Technician", "Diagnose and repair a bounded product fault using saf...", "https://www.w3.org/", "OPEN", u32(1), u32(1), u32(1), u32(0), u256(30000000000000000), u256(45000000000000000), u32(92))
        self.path_ids.append("P-0006"); self.paths["P-0006"] = LearningPath("P-0006", self.owner, "G-001", "Open Documentation Builder", "Create a public technical guide that another practiti...", "https://www.w3.org/", "OPEN", u32(1), u32(1), u32(1), u32(0), u256(30000000000000000), u256(51600000000000000), u32(78))
        self.path_ids.append("P-0007"); self.paths["P-0007"] = LearningPath("P-0007", self.owner, "G-002", "Community Insight Mapper", "Synthesize multiple public-interest observations into...", "https://www.w3.org/", "OPEN", u32(1), u32(0), u32(0), u32(0), u256(30000000000000000), u256(50000000000000000), u32(0))
        self.path_ids.append("P-0008"); self.paths["P-0008"] = LearningPath("P-0008", self.owner, "G-003", "Material Lifecycle Apprentice", "Assess a product lifecycle decision using material co...", "https://www.w3.org/", "OPEN", u32(1), u32(0), u32(0), u32(0), u256(30000000000000000), u256(50000000000000000), u32(0))
        self.path_ids.append("P-0009"); self.paths["P-0009"] = LearningPath("P-0009", self.owner, "G-001", "Peer Learning Coordinator", "Coordinate a small peer learning cycle with explicit...", "https://www.w3.org/", "OPEN", u32(1), u32(0), u32(0), u32(0), u256(30000000000000000), u256(50000000000000000), u32(0))
        self.target_ids.append("T-0001"); self.targets["T-0001"] = SkillTarget("T-0001", "P-0001", "S-0001", "Evidence-led delivery", "Deliver a bounded public project, document principal...", "CREDENTIALLED", "E-0001", "C-0005", u32(95), u32(90), "AWARD", "The evidence provided aligns perfectly with the Guild...")
        self.target_ids.append("T-0002"); self.targets["T-0002"] = SkillTarget("T-0002", "P-0002", "S-0002", "Review and revision practice", "Provide constructive review, trace the resulting revi...", "CREDENTIALLED", "E-0007", "C-0006", u32(92), u32(78), "AWARD", "Portfolio demonstrates bounded outcome documentation,...")
        self.target_ids.append("T-0003"); self.targets["T-0003"] = SkillTarget("T-0003", "P-0003", "S-0003", "Research synthesis", "Frame an ethical question, collect traceable observat...", "CONDITIONAL", "E-0003", "", u32(74), u32(71), "CONDITIONAL", "Evidence is relevant and includes portfolio, verifica...")
        self.target_ids.append("T-0004"); self.targets["T-0004"] = SkillTarget("T-0004", "P-0004", "S-0004", "Facilitated decision", "Prepare an accessible session, capture contributions,...", "CREDENTIALLED", "E-0004", "C-0002", u32(95), u32(90), "AWARD", "The apprentice has demonstrated full alignment with t...")
        self.target_ids.append("T-0005"); self.targets["T-0005"] = SkillTarget("T-0005", "P-0005", "S-0005", "Repair diagnosis", "Isolate a fault, explain material and safety decision...", "CREDENTIALLED", "E-0005", "C-0003", u32(92), u32(95), "AWARD", "The evidence demonstrates a complete mastery of the c...")
        self.target_ids.append("T-0006"); self.targets["T-0006"] = SkillTarget("T-0006", "P-0006", "S-0001", "Reproducible documentation", "Publish a bounded guide with prerequisites, tested st...", "CREDENTIALLED", "E-0006", "C-0004", u32(78), u32(72), "AWARD", "Evidence package covers all rubric dimensions: bounde...")
        self.target_ids.append("T-0007"); self.targets["T-0007"] = SkillTarget("T-0007", "P-0007", "S-0003", "Accountable insight map", "Connect traceable observations to explicit themes, pr...", "PRACTICING", "", "", u32(0), u32(0), "", "")
        self.target_ids.append("T-0008"); self.targets["T-0008"] = SkillTarget("T-0008", "P-0008", "S-0005", "Material lifecycle decision", "Inspect material condition, compare repair and reuse...", "PRACTICING", "", "", u32(0), u32(0), "", "")
        self.target_ids.append("T-0009"); self.targets["T-0009"] = SkillTarget("T-0009", "P-0009", "S-0002", "Peer learning cycle", "Set a shared goal, coordinate review, capture revisio...", "PRACTICING", "", "", u32(0), u32(0), "", "")
        self.attestation_ids.append("A-0001"); self.attestations["A-0001"] = PracticeAttestation("A-0001", "P-0001", "T-0001", "M-0001", "During supervised practice for Evidence Systems Pract...", "https://www.w3.org/", "ACTIVE")
        self.attestation_ids.append("A-0002"); self.attestations["A-0002"] = PracticeAttestation("A-0002", "P-0002", "T-0002", "M-0001", "During supervised practice for Collaborative Review S...", "https://www.w3.org/", "ACTIVE")
        self.attestation_ids.append("A-0003"); self.attestations["A-0003"] = PracticeAttestation("A-0003", "P-0003", "T-0003", "M-0002", "During supervised practice for Public Service Researc...", "https://www.w3.org/", "ACTIVE")
        self.attestation_ids.append("A-0004"); self.attestations["A-0004"] = PracticeAttestation("A-0004", "P-0004", "T-0004", "M-0002", "During supervised practice for Decision Facilitation...", "https://www.w3.org/", "ACTIVE")
        self.attestation_ids.append("A-0005"); self.attestations["A-0005"] = PracticeAttestation("A-0005", "P-0005", "T-0005", "M-0003", "During supervised practice for Circular Repair Techni...", "https://www.w3.org/", "ACTIVE")
        self.attestation_ids.append("A-0006"); self.attestations["A-0006"] = PracticeAttestation("A-0006", "P-0006", "T-0006", "M-0001", "During supervised practice for Open Documentation Bui...", "https://www.w3.org/", "ACTIVE")
        self.evidence_ids.append("E-0001"); self.evidence["E-0001"] = PortfolioEvidence("E-0001", "P-0001", "T-0001", self.owner, "The Evidence Systems Practitioner portfolio publishes...", "https://www.w3.org/", "SUBMITTED")
        self.evidence_ids.append("E-0002"); self.evidence["E-0002"] = PortfolioEvidence("E-0002", "P-0002", "T-0002", self.owner, "The Collaborative Review Steward portfolio publishes...", "https://www.w3.org/", "SUBMITTED")
        self.evidence_ids.append("E-0003"); self.evidence["E-0003"] = PortfolioEvidence("E-0003", "P-0003", "T-0003", self.owner, "The Public Service Researcher portfolio publishes the...", "https://www.w3.org/", "SUBMITTED")
        self.evidence_ids.append("E-0004"); self.evidence["E-0004"] = PortfolioEvidence("E-0004", "P-0004", "T-0004", self.owner, "The Decision Facilitation Practitioner portfolio publ...", "https://www.w3.org/", "SUBMITTED")
        self.evidence_ids.append("E-0005"); self.evidence["E-0005"] = PortfolioEvidence("E-0005", "P-0005", "T-0005", self.owner, "The Circular Repair Technician portfolio publishes th...", "https://www.w3.org/", "SUBMITTED")
        self.evidence_ids.append("E-0006"); self.evidence["E-0006"] = PortfolioEvidence("E-0006", "P-0006", "T-0006", self.owner, "The Open Documentation Builder portfolio publishes th...", "https://www.w3.org/", "SUBMITTED")
        self.evidence_ids.append("E-0007"); self.evidence["E-0007"] = PortfolioEvidence("E-0007", "P-0002", "T-0002", self.owner, "The Collaborative Review Steward portfolio publishes...", "https://www.w3.org/", "SUBMITTED")
        self.credential_ids.append("C-0001"); self.credentials["C-0001"] = Credential("C-0001", "P-0002", "T-0002", "S-0002", self.owner, "Review and revision practice", u32(92), u32(95), "REASSESSMENT", "Evidence demonstrates strong relevance, authenticity,...", u32(1))
        self.credential_ids.append("C-0002"); self.credentials["C-0002"] = Credential("C-0002", "P-0004", "T-0004", "S-0004", self.owner, "Facilitated decision", u32(95), u32(90), "ACTIVE", "The apprentice has demonstrated full alignment with t...", u32(0))
        self.credential_ids.append("C-0003"); self.credentials["C-0003"] = Credential("C-0003", "P-0005", "T-0005", "S-0005", self.owner, "Repair diagnosis", u32(92), u32(95), "ACTIVE", "The evidence demonstrates a complete mastery of the c...", u32(0))
        self.credential_ids.append("C-0004"); self.credentials["C-0004"] = Credential("C-0004", "P-0006", "T-0006", "S-0001", self.owner, "Reproducible documentation", u32(78), u32(72), "ACTIVE", "Evidence package covers all rubric dimensions: bounde...", u32(0))
        self.credential_ids.append("C-0005"); self.credentials["C-0005"] = Credential("C-0005", "P-0001", "T-0001", "S-0001", self.owner, "Evidence-led delivery", u32(95), u32(90), "ACTIVE", "The evidence provided aligns perfectly with the Guild...", u32(0))
        self.credential_ids.append("C-0006"); self.credentials["C-0006"] = Credential("C-0006", "P-0002", "T-0002", "S-0002", self.owner, "Review and revision practice", u32(92), u32(78), "ACTIVE", "Portfolio demonstrates bounded outcome documentation,...", u32(0))
        self.challenge_ids.append("H-0001"); self.challenges["H-0001"] = CredentialChallenge("H-0001", "C-0001", self.owner, "A newly published revision history changes the attrib...", "https://www.w3.org/", u256(5000000000000000), "RESOLVED", "REASSESS", "New revision history alters artifact attribution, dir...")
        self.opportunity_ids.append("O-0001"); self.opportunities["O-0001"] = Opportunity("O-0001", self.owner, "G-001", "Evidence workflow residency", "A bounded professional residency delivering one publi...", "Requires demonstrated evidence-led delivery, reproduc...", "https://www.w3.org/", u256(30000000000000000), u256(80000000000000000), "OPEN", u32(1), "")
        self.opportunity_ids.append("O-0002"); self.opportunities["O-0002"] = Opportunity("O-0002", self.owner, "G-002", "Public service research fellowship", "A time-bounded fellowship synthesizing public-interes...", "Requires governed public service research evidence, e...", "https://www.w3.org/", u256(30000000000000000), u256(80000000000000000), "OPEN", u32(1), "")
        self.opportunity_ids.append("O-0003"); self.opportunities["O-0003"] = Opportunity("O-0003", self.owner, "G-003", "Community repair residency", "A supervised repair residency diagnosing household pr...", "Requires repair diagnosis evidence, workshop safety r...", "https://www.w3.org/", u256(30000000000000000), u256(50000000000000000), "FILLED", u32(1), "X-0003")
        self.opportunity_ids.append("O-0004"); self.opportunities["O-0004"] = Opportunity("O-0004", self.owner, "G-001", "Open documentation commission", "A commission to produce a tested public technical gui...", "Requires evidence-led project delivery, reproducible...", "https://www.w3.org/", u256(30000000000000000), u256(80000000000000000), "OPEN", u32(0), "")
        self.match_ids.append("X-0001"); self.matches["X-0001"] = OpportunityMatch("X-0001", "O-0001", "P-0001", self.owner, "NEAR_MATCH", "NEAR_MATCH", u32(65), "Applicant lacks demonstrated historical credentials o...", "The applicant's learning goal aligns perfectly with t...", u256(0))
        self.match_ids.append("X-0002"); self.matches["X-0002"] = OpportunityMatch("X-0002", "O-0002", "P-0003", self.owner, "NEAR_MATCH", "NEAR_MATCH", u32(60), "No active or historical credentials on file. Without...", "The applicant's learning goal is an almost verbatim m...", u256(0))
        self.match_ids.append("X-0003"); self.matches["X-0003"] = OpportunityMatch("X-0003", "O-0003", "P-0005", self.owner, "ACCEPTED", "MATCH", u32(96), "", "The applicant is a strong direct match. The active cr...", u256(30000000000000000))
        self.total_learning_pool = u256(386600000000000000)
        self.total_opportunity_reserve = u256(290000000000000000)
        self.total_claimable_created = u256(198400000000000000)
        self.governance_epoch = u32(4)
    # MIGRATION_SNAPSHOT_END

    def _text(self, value: str, label: str, minimum: int, maximum: int):
        length = len(value.strip())
        if length < minimum or length > maximum:
            raise gl.vm.UserError(
                f"{EXPECTED} {label} must be {minimum}-{maximum} characters"
            )

    def _https(self, value: str):
        if not value.startswith("https://"):
            raise gl.vm.UserError(f"{EXPECTED} Public URL must use HTTPS")

    def _owner_only(self):
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError(f"{EXPECTED} Owner authorization required")

    def _guild_for(self, guild_id: str) -> Guild:
        if guild_id not in self.guilds:
            raise gl.vm.UserError(f"{EXPECTED} Guild not found")
        return self.guilds[guild_id]

    def _path_for(self, path_id: str) -> LearningPath:
        if path_id not in self.paths:
            raise gl.vm.UserError(f"{EXPECTED} Learning path not found")
        return self.paths[path_id]

    def _target_for(self, target_id: str) -> SkillTarget:
        if target_id not in self.targets:
            raise gl.vm.UserError(f"{EXPECTED} Skill target not found")
        return self.targets[target_id]

    def _path_owner(self, path: LearningPath):
        if gl.message.sender_address != path.apprentice:
            raise gl.vm.UserError(
                f"{EXPECTED} Apprentice authorization required"
            )

    def _guild_authorized(self, guild: Guild):
        sender = gl.message.sender_address
        if sender != guild.founder and sender != self.owner:
            raise gl.vm.UserError(f"{EXPECTED} Guild authorization required")

    def _register_guild(
        self, founder: Address, name: str, domain: str, charter_url: str
    ) -> str:
        guild_id = f"G-{len(self.guild_ids)+1:03d}"
        self.guild_ids.append(guild_id)
        self.guilds[guild_id] = Guild(
            guild_id,
            founder,
            name,
            domain,
            charter_url,
            u32(72),
            u32(0),
            u32(0),
            u32(0),
            u256(0),
            "ACTIVE",
        )
        return guild_id

    def _register_mentor(
        self,
        account: Address,
        guild_id: str,
        name: str,
        specialty: str,
        profile_url: str,
    ) -> str:
        mentor_id = f"M-{len(self.mentor_ids)+1:04d}"
        self.mentor_ids.append(mentor_id)
        self.mentors[mentor_id] = Mentor(
            mentor_id,
            account,
            guild_id,
            name,
            specialty,
            profile_url,
            u32(70),
            u32(0),
            u32(0),
            "ACTIVE",
        )
        guild = self.guilds[guild_id]
        guild.mentor_count += u32(1)
        self.guilds[guild_id] = guild
        return mentor_id

    def _create_standard(
        self,
        author: Address,
        guild_id: str,
        title: str,
        description: str,
        rubric_url: str,
        status: str,
    ) -> str:
        standard_id = f"S-{len(self.standard_ids)+1:04d}"
        self.standard_ids.append(standard_id)
        self.standards[standard_id] = CompetencyStandard(
            standard_id,
            guild_id,
            author,
            title,
            description,
            rubric_url,
            status,
            u32(0),
            u32(0),
            self.governance_epoch,
        )
        guild = self.guilds[guild_id]
        guild.standard_count += u32(1)
        self.guilds[guild_id] = guild
        return standard_id

    def _target_attestations(self, target_id: str) -> list:
        return [
            self.attestations[item]
            for item in self.attestation_ids
            if self.attestations[item].target_id == target_id
        ]

    def _path_credentials(self, path_id: str) -> list:
        return [
            self.credentials[item]
            for item in self.credential_ids
            if self.credentials[item].path_id == path_id
        ]

    def _handle_leader_error(self, result: gl.vm.Result, operation) -> bool:
        if isinstance(result, gl.vm.Return):
            return False
        leader_message = result.message if hasattr(result, "message") else ""
        try:
            operation()
            return False
        except gl.vm.UserError as error:
            validator_message = (
                error.message if hasattr(error, "message") else str(error)
            )
            if validator_message.startswith(EXPECTED):
                return validator_message == leader_message
            return False
        except Exception:
            return False

    @gl.public.write
    def register_guild(
        self, name: str, domain: str, charter_url: str
    ) -> str:
        self._text(name, "Guild name", 4, 90)
        self._text(domain, "Guild domain", 30, 320)
        self._https(charter_url)
        return self._register_guild(
            gl.message.sender_address,
            name.strip(),
            domain.strip(),
            charter_url.strip(),
        )

    @gl.public.write
    def register_mentor(
        self,
        guild_id: str,
        name: str,
        specialty: str,
        profile_url: str,
        account: str,
    ) -> str:
        guild = self._guild_for(guild_id)
        self._guild_authorized(guild)
        self._text(name, "Mentor name", 4, 90)
        self._text(specialty, "Mentor specialty", 40, 500)
        self._https(profile_url)
        return self._register_mentor(
            Address(account),
            guild_id,
            name.strip(),
            specialty.strip(),
            profile_url.strip(),
        )

    @gl.public.write
    def create_standard(
        self,
        guild_id: str,
        title: str,
        description: str,
        rubric_url: str,
    ) -> str:
        guild = self._guild_for(guild_id)
        self._guild_authorized(guild)
        self._text(title, "Standard title", 5, 100)
        self._text(description, "Standard description", 100, 1800)
        self._https(rubric_url)
        return self._create_standard(
            gl.message.sender_address,
            guild_id,
            title.strip(),
            description.strip(),
            rubric_url.strip(),
            "OPEN",
        )

    @gl.public.write
    def vote_standard(self, standard_id: str, support: bool) -> None:
        if standard_id not in self.standards:
            raise gl.vm.UserError(f"{EXPECTED} Standard not found")
        standard = self.standards[standard_id]
        if standard.status != "OPEN":
            raise gl.vm.UserError(f"{EXPECTED} Standard is closed")
        key = f"{standard_id}:{gl.message.sender_address}"
        if key in self.standard_votes:
            raise gl.vm.UserError(f"{EXPECTED} Wallet already voted")
        self.standard_votes[key] = support
        if support:
            standard.yes += u32(1)
        else:
            standard.no += u32(1)
        self.standards[standard_id] = standard

    @gl.public.write
    def close_standard(self, standard_id: str) -> None:
        if standard_id not in self.standards:
            raise gl.vm.UserError(f"{EXPECTED} Standard not found")
        standard = self.standards[standard_id]
        guild = self.guilds[standard.guild_id]
        self._guild_authorized(guild)
        if standard.status != "OPEN":
            raise gl.vm.UserError(f"{EXPECTED} Standard is closed")
        if standard.yes + standard.no == u32(0):
            raise gl.vm.UserError(f"{EXPECTED} Standard has no votes")
        if standard.yes > standard.no:
            standard.status = "PASSED"
            self.governance_epoch += u32(1)
        else:
            standard.status = "REJECTED"
        self.standards[standard_id] = standard

    @gl.public.write.payable
    def create_path(
        self,
        guild_id: str,
        title: str,
        goal: str,
        portfolio_url: str,
        grant_per_credential: u256,
    ) -> str:
        guild = self._guild_for(guild_id)
        if guild.status != "ACTIVE":
            raise gl.vm.UserError(f"{EXPECTED} Guild is not active")
        self._text(title, "Path title", 5, 100)
        self._text(goal, "Learning goal", 80, 1500)
        self._https(portfolio_url)
        path_id = f"P-{len(self.path_ids)+1:04d}"
        self.path_ids.append(path_id)
        self.paths[path_id] = LearningPath(
            path_id,
            gl.message.sender_address,
            guild_id,
            title.strip(),
            goal.strip(),
            portfolio_url.strip(),
            "OPEN",
            u32(0),
            u32(0),
            u32(0),
            u32(0),
            grant_per_credential,
            gl.message.value,
            u32(0),
        )
        guild.path_count += u32(1)
        self.guilds[guild_id] = guild
        if gl.message.value > u256(0):
            self.total_learning_pool += gl.message.value
            self.path_sponsorships[
                f"{path_id}:{gl.message.sender_address}"
            ] = gl.message.value
        return path_id

    @gl.public.write
    def update_portfolio(self, path_id: str, portfolio_url: str) -> None:
        path = self._path_for(path_id)
        self._path_owner(path)
        self._https(portfolio_url)
        path.portfolio_url = portfolio_url.strip()
        self.paths[path_id] = path

    @gl.public.write
    def add_target(
        self,
        path_id: str,
        standard_id: str,
        label: str,
        objective: str,
    ) -> str:
        path = self._path_for(path_id)
        self._path_owner(path)
        if standard_id not in self.standards:
            raise gl.vm.UserError(f"{EXPECTED} Standard not found")
        standard = self.standards[standard_id]
        if standard.guild_id != path.guild_id or standard.status != "PASSED":
            raise gl.vm.UserError(
                f"{EXPECTED} Standard is not active for this guild"
            )
        self._text(label, "Target label", 4, 100)
        self._text(objective, "Target objective", 60, 1000)
        target_id = f"T-{len(self.target_ids)+1:04d}"
        self.target_ids.append(target_id)
        self.targets[target_id] = SkillTarget(
            target_id,
            path_id,
            standard_id,
            label.strip(),
            objective.strip(),
            "PRACTICING",
            "",
            "",
            u32(0),
            u32(0),
            "",
            "",
        )
        path.target_count += u32(1)
        self.paths[path_id] = path
        return target_id

    @gl.public.write.payable
    def sponsor_path(self, path_id: str) -> None:
        path = self._path_for(path_id)
        if path.status == "CLOSED":
            raise gl.vm.UserError(f"{EXPECTED} Learning path is closed")
        if gl.message.value == u256(0):
            raise gl.vm.UserError(f"{EXPECTED} Send a positive GEN amount")
        path.grant_pool += gl.message.value
        self.total_learning_pool += gl.message.value
        key = f"{path_id}:{gl.message.sender_address}"
        self.path_sponsorships[key] = (
            self.path_sponsorships.get(key, u256(0)) + gl.message.value
        )
        self.paths[path_id] = path

    @gl.public.write
    def attest_practice(
        self,
        target_id: str,
        mentor_id: str,
        statement: str,
        evidence_url: str,
    ) -> str:
        target = self._target_for(target_id)
        path = self.paths[target.path_id]
        if mentor_id not in self.mentors:
            raise gl.vm.UserError(f"{EXPECTED} Mentor not found")
        mentor = self.mentors[mentor_id]
        if mentor.account != gl.message.sender_address:
            raise gl.vm.UserError(f"{EXPECTED} Mentor authorization required")
        if mentor.guild_id != path.guild_id or mentor.status != "ACTIVE":
            raise gl.vm.UserError(
                f"{EXPECTED} Mentor is not active for this guild"
            )
        if target.status in ("CREDENTIALLED", "REVOKED"):
            raise gl.vm.UserError(
                f"{EXPECTED} Target does not accept attestations"
            )
        self._text(statement, "Practice attestation", 100, 1600)
        self._https(evidence_url)
        attestation_id = f"A-{len(self.attestation_ids)+1:04d}"
        self.attestation_ids.append(attestation_id)
        self.attestations[attestation_id] = PracticeAttestation(
            attestation_id,
            path.id,
            target_id,
            mentor_id,
            statement.strip(),
            evidence_url.strip(),
            "ACTIVE",
        )
        mentor.attestations += u32(1)
        self.mentors[mentor_id] = mentor
        if target.status == "PRACTICING":
            target.status = "ATTESTED"
            self.targets[target_id] = target
        return attestation_id

    @gl.public.write
    def submit_evidence(
        self, target_id: str, summary: str, evidence_url: str
    ) -> str:
        target = self._target_for(target_id)
        path = self.paths[target.path_id]
        self._path_owner(path)
        if target.status not in (
            "PRACTICING",
            "ATTESTED",
            "MORE_EVIDENCE",
            "REASSESSMENT",
        ):
            raise gl.vm.UserError(
                f"{EXPECTED} Target does not accept evidence"
            )
        self._text(summary, "Portfolio evidence", 120, 1800)
        self._https(evidence_url)
        evidence_id = f"E-{len(self.evidence_ids)+1:04d}"
        self.evidence_ids.append(evidence_id)
        self.evidence[evidence_id] = PortfolioEvidence(
            evidence_id,
            path.id,
            target_id,
            gl.message.sender_address,
            summary.strip(),
            evidence_url.strip(),
            "SUBMITTED",
        )
        target.evidence_id = evidence_id
        target.status = "EVIDENCE_SUBMITTED"
        path.evidence_count += u32(1)
        self.targets[target_id] = target
        self.paths[path.id] = path
        return evidence_id

    @gl.public.write
    def review_competency(self, target_id: str) -> None:
        target = self._target_for(target_id)
        if target.status not in ("EVIDENCE_SUBMITTED", "REASSESSMENT"):
            raise gl.vm.UserError(
                f"{EXPECTED} Target is not ready for competency review"
            )
        path = self.paths[target.path_id]
        standard = self.standards[target.standard_id]
        evidence = self.evidence[target.evidence_id]
        attestations = self._target_attestations(target_id)

        def assess() -> dict:
            result = gl.nondet.exec_prompt(
                f"""Act as an independent professional competency panel.
GUILD STANDARD: {standard}.
LEARNING PATH: {path}.
TARGET OBJECTIVE: {target.objective}.
PORTFOLIO EVIDENCE: {evidence}.
MENTOR PRACTICE ATTESTATIONS: {attestations}.
Judge evidence relevance, authenticity signals, reproducibility, independent
practice, decision quality, professional communication, rubric coverage, and
whether the demonstrated work supports a portable credential.
Return JSON exactly:
{{"verdict":"AWARD"|"CONDITIONAL"|"MORE_EVIDENCE"|"REJECT","proficiency":0-100,"confidence":0-100,"grant_bps":0-10000,"reasoning":"specific plain-language finding under 700 characters"}}.
Use grant_bps only for AWARD and never exceed 10000.""",
                response_format="json",
            )
            if not isinstance(result, dict):
                raise gl.vm.UserError(
                    f"{LLM_ERROR} Invalid competency assessment"
                )
            verdict = str(result.get("verdict", "")).upper()
            if verdict not in (
                "AWARD",
                "CONDITIONAL",
                "MORE_EVIDENCE",
                "REJECT",
            ):
                raise gl.vm.UserError(
                    f"{LLM_ERROR} Invalid competency verdict"
                )
            proficiency = max(
                0, min(100, int(result.get("proficiency", 0)))
            )
            confidence = max(0, min(100, int(result.get("confidence", 0))))
            grant_bps = max(0, min(10000, int(result.get("grant_bps", 0))))
            if verdict != "AWARD":
                grant_bps = 0
            return {
                "verdict": verdict,
                "proficiency": proficiency,
                "confidence": confidence,
                "grant_bps": grant_bps,
                "reasoning": str(result.get("reasoning", ""))[:700],
            }

        def validate(result: gl.vm.Result) -> bool:
            if not isinstance(result, gl.vm.Return):
                return self._handle_leader_error(result, assess)
            leader = result.calldata
            if not isinstance(leader, dict):
                return False
            try:
                independent = assess()
                if leader.get("verdict") != independent["verdict"]:
                    return False
                if (
                    abs(
                        int(leader.get("proficiency", -1))
                        - independent["proficiency"]
                    )
                    > 20
                ):
                    return False
                if (
                    abs(
                        int(leader.get("confidence", -1))
                        - independent["confidence"]
                    )
                    > 25
                ):
                    return False
                return True
            except Exception:
                return False

        decision = gl.vm.run_nondet_unsafe(assess, validate)
        target.verdict = decision["verdict"]
        target.proficiency = u32(decision["proficiency"])
        target.confidence = u32(decision["confidence"])
        target.reasoning = decision["reasoning"]
        if decision["verdict"] == "AWARD":
            credential_id = f"C-{len(self.credential_ids)+1:04d}"
            self.credential_ids.append(credential_id)
            self.credentials[credential_id] = Credential(
                credential_id,
                path.id,
                target_id,
                standard.id,
                path.apprentice,
                target.label,
                target.proficiency,
                target.confidence,
                "ACTIVE",
                target.reasoning,
                u32(0),
            )
            target.credential_id = credential_id
            target.status = "CREDENTIALLED"
            previous_count = int(path.credential_count)
            path.credential_count += u32(1)
            total_score = (
                int(path.average_proficiency) * previous_count
                + int(target.proficiency)
            )
            path.average_proficiency = u32(
                total_score // int(path.credential_count)
            )
            requested = (
                path.grant_per_credential
                * u256(decision["grant_bps"])
                // u256(10000)
            )
            grant = (
                requested
                if requested <= path.grant_pool
                else path.grant_pool
            )
            if grant > u256(0):
                path.grant_pool -= grant
                self.total_learning_pool -= grant
                self.claimable[path.apprentice] = (
                    self.claimable.get(path.apprentice, u256(0)) + grant
                )
                self.total_claimable_created += grant
            self.account_reputation[path.apprentice] = (
                self.account_reputation.get(path.apprentice, u32(50))
                + u32(4)
            )
            for attestation in attestations:
                mentor = self.mentors[attestation.mentor_id]
                mentor.successful_reviews += u32(1)
                mentor.reputation += u32(2)
                self.mentors[mentor.id] = mentor
        elif decision["verdict"] == "CONDITIONAL":
            target.status = "CONDITIONAL"
        elif decision["verdict"] == "MORE_EVIDENCE":
            target.status = "MORE_EVIDENCE"
        else:
            target.status = "REJECTED"
        self.targets[target_id] = target
        self.paths[path.id] = path

    @gl.public.write.payable
    def challenge_credential(
        self, credential_id: str, grounds: str, evidence_url: str
    ) -> str:
        if credential_id not in self.credentials:
            raise gl.vm.UserError(f"{EXPECTED} Credential not found")
        credential = self.credentials[credential_id]
        if credential.status not in ("ACTIVE", "CONDITIONAL"):
            raise gl.vm.UserError(
                f"{EXPECTED} Credential is not challengeable"
            )
        if gl.message.value == u256(0):
            raise gl.vm.UserError(f"{EXPECTED} Challenge bond is required")
        self._text(grounds, "Challenge grounds", 100, 1600)
        self._https(evidence_url)
        challenge_id = f"H-{len(self.challenge_ids)+1:04d}"
        self.challenge_ids.append(challenge_id)
        self.challenges[challenge_id] = CredentialChallenge(
            challenge_id,
            credential_id,
            gl.message.sender_address,
            grounds.strip(),
            evidence_url.strip(),
            gl.message.value,
            "OPEN",
            "",
            "",
        )
        credential.challenge_count += u32(1)
        credential.status = "CHALLENGED"
        path = self.paths[credential.path_id]
        path.challenge_count += u32(1)
        self.credentials[credential_id] = credential
        self.paths[path.id] = path
        return challenge_id

    @gl.public.write
    def resolve_challenge(self, challenge_id: str) -> None:
        if challenge_id not in self.challenges:
            raise gl.vm.UserError(f"{EXPECTED} Challenge not found")
        challenge = self.challenges[challenge_id]
        if challenge.status != "OPEN":
            raise gl.vm.UserError(f"{EXPECTED} Challenge is closed")
        credential = self.credentials[challenge.credential_id]
        target = self.targets[credential.target_id]
        standard = self.standards[credential.standard_id]

        def assess() -> dict:
            result = gl.nondet.exec_prompt(
                f"""Act as an independent credential challenge panel.
CREDENTIAL: {credential}.
COMPETENCY STANDARD: {standard}.
ORIGINAL FINDING: {credential.reasoning}.
CHALLENGE GROUNDS: {challenge.grounds}.
NEW PUBLIC EVIDENCE: {challenge.evidence_url}.
Decide whether the challenge materially undermines the credential evidence,
changes rubric coverage, or requires a fresh review.
Return JSON exactly:
{{"verdict":"UPHOLD"|"REASSESS"|"REVOKE","reasoning":"specific plain-language finding under 700 characters"}}.""",
                response_format="json",
            )
            if not isinstance(result, dict):
                raise gl.vm.UserError(
                    f"{LLM_ERROR} Invalid challenge assessment"
                )
            verdict = str(result.get("verdict", "")).upper()
            if verdict not in ("UPHOLD", "REASSESS", "REVOKE"):
                raise gl.vm.UserError(
                    f"{LLM_ERROR} Invalid challenge verdict"
                )
            return {
                "verdict": verdict,
                "reasoning": str(result.get("reasoning", ""))[:700],
            }

        def validate(result: gl.vm.Result) -> bool:
            if not isinstance(result, gl.vm.Return):
                return self._handle_leader_error(result, assess)
            leader = result.calldata
            if not isinstance(leader, dict):
                return False
            try:
                independent = assess()
                return leader.get("verdict") == independent["verdict"]
            except Exception:
                return False

        decision = gl.vm.run_nondet_unsafe(assess, validate)
        challenge.verdict = decision["verdict"]
        challenge.reasoning = decision["reasoning"]
        challenge.status = "RESOLVED"
        guild = self.guilds[self.paths[credential.path_id].guild_id]
        if decision["verdict"] == "UPHOLD":
            credential.status = "ACTIVE"
            guild.pool += challenge.bond
        elif decision["verdict"] == "REASSESS":
            credential.status = "REASSESSMENT"
            target.status = "REASSESSMENT"
            self.claimable[challenge.challenger] = (
                self.claimable.get(challenge.challenger, u256(0))
                + challenge.bond
            )
            self.total_claimable_created += challenge.bond
        else:
            credential.status = "REVOKED"
            target.status = "REVOKED"
            self.claimable[challenge.challenger] = (
                self.claimable.get(challenge.challenger, u256(0))
                + challenge.bond
            )
            self.total_claimable_created += challenge.bond
            holder_rep = self.account_reputation.get(
                credential.holder, u32(50)
            )
            self.account_reputation[credential.holder] = (
                holder_rep - u32(5) if holder_rep >= u32(5) else u32(0)
            )
        self.challenges[challenge_id] = challenge
        self.credentials[credential.id] = credential
        self.targets[target.id] = target
        self.guilds[guild.id] = guild

    @gl.public.write.payable
    def publish_opportunity(
        self,
        guild_id: str,
        title: str,
        description: str,
        requirements: str,
        public_url: str,
        reward: u256,
    ) -> str:
        self._guild_for(guild_id)
        self._text(title, "Opportunity title", 5, 100)
        self._text(description, "Opportunity description", 100, 1600)
        self._text(requirements, "Opportunity requirements", 100, 1600)
        self._https(public_url)
        if reward > gl.message.value:
            raise gl.vm.UserError(
                f"{EXPECTED} Opportunity reserve is below reward"
            )
        opportunity_id = f"O-{len(self.opportunity_ids)+1:04d}"
        self.opportunity_ids.append(opportunity_id)
        self.opportunities[opportunity_id] = Opportunity(
            opportunity_id,
            gl.message.sender_address,
            guild_id,
            title.strip(),
            description.strip(),
            requirements.strip(),
            public_url.strip(),
            reward,
            gl.message.value,
            "OPEN",
            u32(0),
            "",
        )
        self.total_opportunity_reserve += gl.message.value
        return opportunity_id

    @gl.public.write
    def apply_opportunity(self, opportunity_id: str, path_id: str) -> str:
        if opportunity_id not in self.opportunities:
            raise gl.vm.UserError(f"{EXPECTED} Opportunity not found")
        opportunity = self.opportunities[opportunity_id]
        if opportunity.status != "OPEN":
            raise gl.vm.UserError(f"{EXPECTED} Opportunity is closed")
        path = self._path_for(path_id)
        self._path_owner(path)
        if path.guild_id != opportunity.guild_id:
            raise gl.vm.UserError(
                f"{EXPECTED} Learning path belongs to another guild"
            )
        match_id = f"X-{len(self.match_ids)+1:04d}"
        self.match_ids.append(match_id)
        self.matches[match_id] = OpportunityMatch(
            match_id,
            opportunity_id,
            path_id,
            path.apprentice,
            "PENDING",
            "",
            u32(0),
            "",
            "",
            u256(0),
        )
        opportunity.application_count += u32(1)
        self.opportunities[opportunity_id] = opportunity
        return match_id

    @gl.public.write
    def review_match(self, match_id: str) -> None:
        if match_id not in self.matches:
            raise gl.vm.UserError(f"{EXPECTED} Match not found")
        match = self.matches[match_id]
        if match.status not in ("PENDING", "REASSESSMENT"):
            raise gl.vm.UserError(f"{EXPECTED} Match is not reviewable")
        opportunity = self.opportunities[match.opportunity_id]
        path = self.paths[match.path_id]
        credentials = self._path_credentials(path.id)

        def assess() -> dict:
            result = gl.nondet.exec_prompt(
                f"""Act as an independent professional opportunity matching panel.
OPPORTUNITY: {opportunity}.
REQUIREMENTS: {opportunity.requirements}.
APPLICANT LEARNING GOAL: {path.goal}.
ACTIVE AND HISTORICAL CREDENTIALS: {credentials}.
Judge direct requirement coverage, proficiency, credential status, transferable
evidence, material gaps, and whether eligibility should be durable.
Return JSON exactly:
{{"verdict":"MATCH"|"NEAR_MATCH"|"NO_MATCH","fit_score":0-100,"gaps":"specific gaps under 500 characters","reasoning":"specific plain-language finding under 700 characters"}}.""",
                response_format="json",
            )
            if not isinstance(result, dict):
                raise gl.vm.UserError(f"{LLM_ERROR} Invalid match assessment")
            verdict = str(result.get("verdict", "")).upper()
            if verdict not in ("MATCH", "NEAR_MATCH", "NO_MATCH"):
                raise gl.vm.UserError(f"{LLM_ERROR} Invalid match verdict")
            return {
                "verdict": verdict,
                "fit_score": max(
                    0, min(100, int(result.get("fit_score", 0)))
                ),
                "gaps": str(result.get("gaps", ""))[:500],
                "reasoning": str(result.get("reasoning", ""))[:700],
            }

        def validate(result: gl.vm.Result) -> bool:
            if not isinstance(result, gl.vm.Return):
                return self._handle_leader_error(result, assess)
            leader = result.calldata
            if not isinstance(leader, dict):
                return False
            try:
                independent = assess()
                return (
                    leader.get("verdict") == independent["verdict"]
                    and abs(
                        int(leader.get("fit_score", -1))
                        - independent["fit_score"]
                    )
                    <= 20
                )
            except Exception:
                return False

        decision = gl.vm.run_nondet_unsafe(assess, validate)
        match.verdict = decision["verdict"]
        match.fit_score = u32(decision["fit_score"])
        match.gaps = decision["gaps"]
        match.reasoning = decision["reasoning"]
        if decision["verdict"] == "MATCH":
            match.status = "MATCHED"
        elif decision["verdict"] == "NEAR_MATCH":
            match.status = "NEAR_MATCH"
        else:
            match.status = "DECLINED"
        self.matches[match_id] = match

    @gl.public.write
    def accept_match(self, match_id: str) -> None:
        if match_id not in self.matches:
            raise gl.vm.UserError(f"{EXPECTED} Match not found")
        match = self.matches[match_id]
        opportunity = self.opportunities[match.opportunity_id]
        if gl.message.sender_address != opportunity.publisher:
            raise gl.vm.UserError(
                f"{EXPECTED} Opportunity publisher authorization required"
            )
        if match.status != "MATCHED" or opportunity.status != "OPEN":
            raise gl.vm.UserError(f"{EXPECTED} Match cannot be accepted")
        reward = (
            opportunity.reward
            if opportunity.reward <= opportunity.reserve
            else opportunity.reserve
        )
        opportunity.reserve -= reward
        self.total_opportunity_reserve -= reward
        opportunity.status = "FILLED"
        opportunity.accepted_match_id = match_id
        match.status = "ACCEPTED"
        match.reward_created = reward
        if reward > u256(0):
            self.claimable[match.applicant] = (
                self.claimable.get(match.applicant, u256(0)) + reward
            )
            self.total_claimable_created += reward
        self.matches[match_id] = match
        self.opportunities[opportunity.id] = opportunity

    @gl.public.write
    def claim(self) -> None:
        sender = gl.message.sender_address
        amount = self.claimable.get(sender, u256(0))
        if amount == u256(0):
            raise gl.vm.UserError(f"{EXPECTED} Nothing to claim")
        self.claimable[sender] = u256(0)
        _Recipient(sender).emit_transfer(value=amount)

    @gl.public.view
    def get_overview(self) -> dict:
        return {
            "guilds": len(self.guild_ids),
            "mentors": len(self.mentor_ids),
            "standards": len(self.standard_ids),
            "active_standards": sum(
                1
                for item in self.standard_ids
                if self.standards[item].status == "PASSED"
            ),
            "paths": len(self.path_ids),
            "targets": len(self.target_ids),
            "attestations": len(self.attestation_ids),
            "evidence": len(self.evidence_ids),
            "credentials": len(self.credential_ids),
            "active_credentials": sum(
                1
                for item in self.credential_ids
                if self.credentials[item].status == "ACTIVE"
            ),
            "open_challenges": sum(
                1
                for item in self.challenge_ids
                if self.challenges[item].status == "OPEN"
            ),
            "opportunities": len(self.opportunity_ids),
            "open_opportunities": sum(
                1
                for item in self.opportunity_ids
                if self.opportunities[item].status == "OPEN"
            ),
            "matches": len(self.match_ids),
            "governance_epoch": int(self.governance_epoch),
            "migration_source_network": self.migration_source_network,
            "migration_source_contract": self.migration_source_contract,
            "migration_source_transactions": int(
                self.migration_source_transactions
            ),
            "total_learning_pool": str(self.total_learning_pool),
            "total_opportunity_reserve": str(
                self.total_opportunity_reserve
            ),
            "total_claimable_created": str(self.total_claimable_created),
        }

    @gl.public.view
    def get_guilds(self) -> list:
        return [self.guilds[item] for item in self.guild_ids]

    @gl.public.view
    def get_mentors(self) -> list:
        return [self.mentors[item] for item in self.mentor_ids]

    @gl.public.view
    def get_standards(self) -> list:
        return [self.standards[item] for item in self.standard_ids]

    @gl.public.view
    def get_paths(self) -> list:
        return [self.paths[item] for item in self.path_ids]

    @gl.public.view
    def get_targets(self) -> list:
        return [self.targets[item] for item in self.target_ids]

    @gl.public.view
    def get_attestations(self) -> list:
        return [self.attestations[item] for item in self.attestation_ids]

    @gl.public.view
    def get_evidence(self) -> list:
        return [self.evidence[item] for item in self.evidence_ids]

    @gl.public.view
    def get_credentials(self) -> list:
        return [self.credentials[item] for item in self.credential_ids]

    @gl.public.view
    def get_challenges(self) -> list:
        return [self.challenges[item] for item in self.challenge_ids]

    @gl.public.view
    def get_opportunities(self) -> list:
        return [self.opportunities[item] for item in self.opportunity_ids]

    @gl.public.view
    def get_matches(self) -> list:
        return [self.matches[item] for item in self.match_ids]

    @gl.public.view
    def get_profile(self, account: str) -> dict:
        address = Address(account)
        return {
            "account": account,
            "reputation": int(
                self.account_reputation.get(address, u32(50))
            ),
            "claimable": str(self.claimable.get(address, u256(0))),
            "paths": sum(
                1
                for item in self.path_ids
                if self.paths[item].apprentice == address
            ),
            "credentials": sum(
                1
                for item in self.credential_ids
                if self.credentials[item].holder == address
            ),
            "mentorships": sum(
                1
                for item in self.mentor_ids
                if self.mentors[item].account == address
            ),
            "opportunities": sum(
                1
                for item in self.opportunity_ids
                if self.opportunities[item].publisher == address
            ),
        }
