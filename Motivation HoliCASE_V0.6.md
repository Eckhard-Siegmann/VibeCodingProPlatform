# HoliCASE — Holistic Compliance & Audit Software Engineering (The 4LC North Star)

## 0. Purpose
HoliCASE is the ontological foundation for the project's **Liquid Audit Graph**. It replaces loose document collections with a typed, directed graph of **4-Letter Code (4LC)** artifacts. It is optimized for:
- **Audit-Grade Traceability:** Enforcing the `Clause → Control → Implementation` spine.
- **Deterministic Compliance:** Every line of code exists to satisfy a Control, which satisfies a Normative Clause.
- **Graph-Based Governance:** Waivers, Risks, and Tailoring are first-class nodes (`DWAV`, `DRSK`), not metadata flags.
- **VibeGov Execution:** The graph structure enforces the governance rules defined in NPOL-0010.

---

## 1. Scope (lifecycle coverage, compact)
- Strategy & VoC, value hypothesis, success metrics
- Requirements engineering + validation (completeness/consistency/review)
- Architecture & models; design specs; prototypes/spikes; formal methods (when required)
- Supply chain governance (dependencies, SBOM/attestation, vulnerability posture)
- Verification & validation; testing across levels; quality gates
- CI/CD, deployment, operations, observability, documentation-as-code
- Safety, security, risk, compliance, assurance case
- Automated audit traversals and templated authority-grade reports

---

## 2. Core conceptual model
### 2.1 Graph primitives
- **Artifact (node):** typed unit of meaning
- **Relation (edge):** typed, directed semantics + required attributes
- **Profile:** curated bundle of artifact types, relations, constraints for a domain
- **Namespace:** extensibility boundary; all new terms must be namespaced

### 2.2 Provenance and metadata baseline
- Use a standard **metadata vocabulary** for identity, timestamps, authorship, validity windows, and provenance.
- Use a standard **provenance model** for derivation and generation chains (artifact ↔ activity ↔ agent).

### 2.3 “Invalidator analogue” (change impact)
Instead of proliferating dependency predicates, HoliCASE uses graph propagation:
- **Invalidator Engine:** Changes to a `NCLA` (Normative Clause) propagate a `suspect` state to linked `CCTL` (Controls) and `CIMP` (Implementations).
- **Explicit Dispositions:** Exceptions are modeled as distinct `DWAV` nodes that interrupt the invalidation chain if approved.

---

## 3. The 4LC Domain Taxonomy (Superclasses)
HoliCASE organizes the world into 8 immutable domains. The first letter of every Artifact ID denotes its domain.

1.  **N - Normative:** Laws, Standards, Policies, and their atomic Clauses.
2.  **D - Disposition:** Logic of applicability, tailoring, waivers, and accepted risks.
3.  **C - Control:** The audit backbone; the bridge between "Law" and "Engineering".
4.  **E - Engineering:** The V-Model content (Requirements, Architecture, Design, Code).
5.  **V - Verification:** Evidence of truth (Tests, Reviews, Scans, Attestations).
6.  **A - Assessment:** The auditor’s view (Scope, Traversal Logic, Reports, Findings).
7.  **P - Provenance & Config:** Baselines, Snapshots, Toolchains, Environments.
8.  **W - Work Management:** Tasks and Corrective Actions.
9.  **O - Operations:** Deployment, CI/CD, Runtime, and Lifecycle Management.

---

## 4. Artifact Types (The 4LC Members)

### 4.1 N - Normative (The "Why")
- **`NDOC`**: Normative Document (Standard, Governmental Policy, Regulation, Datasheet).
- **`NPOL`**: Normative Document (Project Policy)
- **`NPRC`**: Normative Document (Project Process)
- **`NVER`**: Document Version (Immutable, hashed snapshot of an NDOC).
- **`NCLA`**: Normative Clause (Atomic paragraph/statement to comply with).
- **`NDCR`**: Derived Compliance Requirement (Project interpretation of a clause).
- **`NSTM`**: Atomic Normative Statement (Fine-grained extraction for high risk).
- **`NWSS`**: Web Source Snapshot (Captured external reference).

### 4.2 D - Disposition (The "Exceptions")
- **`DMAT`**: Applicability Matrix (Mapping Project Scope $\times$ Standard).
- **`DTAL`**: Tailoring Decision (Applicable / Not Applicable + Rationale).
- **`DINP`**: Interpretation Note (Clarification of ambiguity).
- **`DWAV`**: Waiver / Deviation (Approved exception node; prevents "Invalid" state).
- **`DCMP`**: Compensating Measure (Alternative mitigation for a Waiver).
- **`DRSK`**: Residual Risk Acceptance (Formal record of accepted risk).

### 4.3 C - Control (The "What")
- **`COBJ`**: Control Objective (Grouping of related controls).
- **`CCTL`**: Compliance Control (The auditable requirement/measure, check gate).
- **`CIMP`**: Control Implementation (The conceptual realization of the control).

### 4.4 E - Engineering (The "How")
- **`EREQ`**: Requirement (Subtypes via attributes: Stakeholder, System, Software).
- **`EMOD`**: Requirement Module (Container/Collection).
- **`EDSN`**: Design Specification (Detailed solution design).
- **`EADR`**: Architecture Decision Record (Rationale for design).
- **`EARC`**: Architecture Element (Component, Interface, Data Model).
- **`ECOD`**: Code Unit (Module, Service, Library).
- **`EPRM`**: Prompt for LLM.
- **`ECFG`**: Configuration Artifact (Feature flags, Runtime config).
- **`EIAC`**: Infrastructure as Code (Resource definitions).
- **`ETHR`**: Threat Model.
- **`ERSK`**: Risk / Hazard (Safety/Security risk).
- **`ESPK`**: Prototype / Spike.

### 4.5 V - Verification (The "Proof")
- **`VTST`**: Test Case (Executable specification).
- **`VSTS`**: Test Suite (Collection).
- **`VEXE`**: Test Execution Record (Run instance).
- **`VEVL`**: LLM Evaluation
- **`VRES`**: Analysis Result (Static analysis, Security scan output).
- **`VREV`**: Review Record (Human approval/sign-off).
- **`VSBM`**: SBOM (Software Bill of Materials).
- **`VATT`**: Supply Chain Attestation.
- **`VRUN`**: Runtime Evidence (Logs, Metrics).
- **`VEVP`**: Evidence Package (Curated bundle for audit).

### 4.6 A - Assessment (The "Audit")
- **`APRG`**: Audit Program (e.g., "ISO 27001 Annual").
- **`ASCP`**: Audit Scope (Boundary definition).
- **`ATRV`**: Audit Traversal Definition (The logic/script).
- **`ARUN`**: Audit Run (Execution of a traversal).
- **`ATMP`**: Audit Report Template.
- **`ARPT`**: Audit Report Instance (Generated output).
- **`AFND`**: Finding / Non-conformance.
- **`ACAP`**: Corrective Action Plan.

### 4.7 P - Provenance & Config (The "State")
- **`PBSL`**: Baseline Snapshot (Project level freeze).
- **`PTOL`**: Toolchain Baseline (Compiler/Linter versions).
- **`PENV`**: Environment Baseline (Prod/Stage config).
- **`PTQR`**: Tool Qualification Record.

### 4.8 W - Work Management (The "Tasks")
- **`WITM`**: Work Item (Task, Feature, Bug).
- **`WCOR`**: Corrective Action (Remediation task linked to Finding).

### 4.9 O - Operations (The "Run")
- **`OPRC`**: Operational Procedure (Standard Operating Procedure for Ops).
- **`ORBK`**: Operational Runbook (Standard procedures, e.g., "Rollback Procedure").
- **`OPIP`**: Pipeline Definition (CI/CD logic, stages, gates).
- **`OREL`**: Release Record (The formal "Release" entity, linking version to build).
- **`ODEP`**: Deployment Event (Log/Trace of a specific deployment to an environment).
- **`OINC`**: Incident Record (Production issue tracking).
- **`OSLO`**: Service Level Objective (Reliability targets).

---

## 5. Relation (edge) vocabulary — compact but audit-strong

### 5.1 Core lifecycle relations
- **hasPart / isPartOf**
- **refines / refinedBy**
- **elaborates / elaboratedBy**
- **specifies / specifiedBy**
- **satisfies / satisfiedBy**
- **verifies / verifiedBy**
- **validates / validatedBy**
- **conformsTo**
- **dependsOn**
- **configuredBy**
- **builtFrom**
- **deployedTo**
- **replaces / replacedBy**
- **trackedBy / tracks**
- **affectedBy / affects**
- **conflictsWith**
- **duplicates**

### 5.2 Normative and audit-specific relations (minimal additions)
- **versionOf** (DocumentVersion ↔ NormativeDocument)
- **definesClause** (DocumentVersion → NormativeClause)
- **derivedFromClause** (DerivedComplianceRequirement/Control → NormativeClause)
- **appliesTo** (Clause/Control/Assessment → Scope/Component/Phase)
- **tailoredBy** (NormativeClause → TailoringDecision)
- **interpretedBy** (NormativeClause → InterpretationNote)
- **waivedBy** (Clause/Control → `DWAV`)
- **compensatedBy** (`DWAV` → `DCMP`)
- **acceptsRisk** (`DWAV`/`AFND` → `DRSK`)
- **invalidates** (Change Event → Artifact)
- **implementedAs** (ComplianceControl → ControlImplementation)
- **evidencedBy** (Control/Assessment → EvidenceArtifact/EvidencePackage)
- **assessedBy** (Clause/Control → AuditRun)
- **producesReport** (AuditRun → AuditReportInstance)
- **conformsToTemplate** (AuditReportInstance → Template/Schema)
- **hasFinding** (AuditRun/Report → FindingNonconformance)
- **remediatedBy** (Finding → CorrectiveAction/Plan)

### 5.3 Provenance relations (standard provenance pattern)
- **wasDerivedFrom**
- **wasGeneratedBy**
- **used**
- **wasAttributedTo**

> UI labels may be friendly; canonical identifiers should follow standard provenance semantics.

---

## 6. Mandatory edge attributes (to enable deterministic automation)
For dependency-bearing edges:
- **edgeState** (`valid | suspect | needsReview | invalid`)
- **impactPolicy** (`none | suspect | requiresReview | requiresRevalidation | regenerate | rerunTests | blockRelease`)
- **scope** (component/env/version range)
- **justificationRef** (ADR/approval/interpretation)
- **confidence** (especially for auto-suggested links)

---

## 7. The Audit Control Spine
HoliCASE mandates a strict derivation chain for auditability. The classic "V-Model" is replaced by the "Control Spine".

### 7.1 The Universal Pattern
1.  **Why?** → **`NCLA`** (Normative Clause). Even a user feature is a "Clause" from the "Product Strategy".
2.  **What?** → **`CCTL`** (Compliance Control). The constraint or function that satisfies the clause.
3.  **How?** → **`CIMP`** (Control Implementation). The design or code realization.
4.  **Proof?** → **`V...`** (Evidence).

### 7.2 Operational Profiles
Projects configure the spine rigor based on criticality.

**Profile A: Fast Track (Functional/Creative)**
* `NCLA` (User Story) → `CCTL` (Functional Spec) → `CIMP` (Code).
* *Used for: UI tweaks, non-critical features.*

**Profile B: Regulated (Safety/Security/Privacy)**
* `NCLA` (ISO Clause) → `NDCR` (Safety Goal) → `CCTL` (Technical Safety Req) → `CIMP` (Safety Mechanism) + `VTST` (Verification).
* *Used for: Auth, Crypto, PII handling, Safety loops.*

### 7.3 Dispositions as Graph Nodes
Exceptions are **not** metadata attributes. They are nodes in the graph.
* **Waiver (`DWAV`):** To ignore a `NCLA`, you must insert a `DWAV` node. The graph traversal stops at the Waiver. If the Waiver expires, the traversal falls through to "Non-Compliant".
* **Risk (`DRSK`):** A `DWAV` often requires a linked `DRSK` to acknowledge the gap.

---

## 8. VibeGov — extension policy (must obey, compact)
- **No ontology drift:** core semantics are stable; changes require deprecation + migration.
- **Additive by default:** new types/edges must be namespaced and mapped to a superclass.
- **Explicit semantics:** definition + examples + non-examples + allowed type-pairs.
- **Audit invariants:** do not bypass controls/evidence/assessment/report spine.
- **Provenance required:** generated artifacts must be attributable and derivation-traceable.
- **Deterministic checks:** validators and traversals must be computable and test-covered.
- **Safety/security gating:** changes affecting gates/permissions/controls require threat/risk notes + tests.
- **Mapping discipline:** import must preserve native IDs and unmapped properties (extension bag).

## 9. Additional policies (HoliCASE)

### 9.1 Ontology governance & versioning policy
- **Purpose:** preserve semantic stability while enabling continuous extension and painless migration.
- **Canonical IDs:** every type, relation, and controlled term has a stable, namespaced identifier; UI labels are secondary.
- **Change discipline:** no silent semantic repurposing; use **deprecate → replace → migrate** with explicit mappings and compatibility notes.
- **Constraint formalization:** express structural rules (type-pairs, cardinalities, required properties, invariants) as machine-checkable shapes; SHACL is the reference model for constraint expression and validation reports.
- **Version meaning:** treat the ontology as an API; publish compatibility using Semantic Versioning semantics.
- **Governance trace:** ontology edits must carry authorship, timestamps, rationale, and provenance; use Dublin Core Terms for metadata and PROV semantics for derivation/attribution patterns.
- **LLM retrieval hint:** search for “SHACL shapes validation report”, “SemVer compatibility rules”, “PROV-O entity activity agent”, “DCMI Terms created/modified/provenance”.

**References:**  
[1] W3C:contentReference[oaicite:0]{index=0}Language (SHACL) Recommendation. :contentReference[oaicite:1]{index=1} Versioning 2.0.0 specification. :contentReference[oaicite:2]{index=2} W3C PROV-O (The PROV Ontology). :contentReference[oaicite:3]{index=3}adata Terms (Dublin Core Terms).   

---

### 9.2 Evidence sufficiency & assurance case policy
- **Purpose:** ensure that compliance claims are supported by **sufficient, reviewable evidence**, not merely trace links.
- **Evidence classes:** test specifications + executions, analysis outputs (static/formal/security scans), review/approval records, runtime evidence (when applicable), and supply-chain attestations.
- **Assurance argumentation:** any “intent met” claim (especially waivers/compensations) must be expressible as **Claim → Argument → Evidence**; store the argument structure as an auditable artifact graph.
- **Reference structures:** use Goal Structuring Notation (GSN) for human-auditable argument layouts; use SACM as a machine-oriented metamodel for exchangeable assurance cases.
- **Assessment procedures:** define how controls are assessed (method, rigor, sampling, independence) and encode the procedure into traversal definitions; align procedure vocabulary with established control assessment methodology.
- **Audit program expectations:** define assessor competence, audit program management, evidence sampling rationale, reporting and closure expectations (including corrective actions).
- **LLM retrieval hint:** search for “GSN goals strategies solutions”, “SACM claim argument evidence metamodel”, “NIST 800-53A assessment procedures schema”, “ISO 19011 audit program guidance”.

**References:**  
[1] :contentReference[oaicite:4]{index=4}ard (Goal Structuring Notation).   
:contentReference[oaicite:5]{index=5}e Metamodel (SACM).   
[3] NIST SP 800-53A Rev. 5 (Assessing Security and Priv:contentReference[oaicite:6]{index=6}des structured schema concepts).   
[4] ISO 19011:2018 ove:contentReference[oaicite:7]{index=7}or auditing management systems).   

---

### 9.3 Supply chain integrity & provenance policy
- **Purpose:** make composition, provenance, and integrity verifiable across dependencies, builds, and releases.
- **SBOM standardization:** generate and retain SBOMs in a standardized format; SPDX is the primary reference model (also standardized as ISO/IEC 5962).
- **Provenance attestations:** record verifiable build provenance (who/what/when/how produced an artifact) and bind attestations to build outputs; use SLSA provenance as a reference for provenance content and assurance progression.
- **Attestation structure:** prefer in-toto attestation concepts (statement + predicate type) so policy engines can validate claims programmatically.
- **Transparency and non-repudiation:** publish signing/provenance metadata to a transparency log; use sigstore/Rekor concepts as the reference model for append-only logging and proof-of-inclusion verification.
- **Gate semantics:** releases must carry SBOM + provenance attestation + signature/transparency evidence unless explicitly waived with compensations + residual risk acceptance.
- **LLM retrieval hint:** search for “SPDX SBOM specification”, “SLSA provenance predicate”, “in-toto attestation statement predicate”, “sigstore Rekor transparency log inclusion proof”.

**References:**  
[1] SPDX project and spe:contentReference[oaicite:8]{index=8}EC 5962:2021 note).   
:contentReference[oaicite:9]{index=9}provenance section.   
:contentReference[oaicite:10]{index=10}view. :contentReference[oaicite:11]{index=11}view.   

---

### 9.4 Security policy & control catalog policy
- **Purpose:** define a control baseline that is auditable, mappable, and testable across the lifecycle.
- **Control baseline:** adopt ISO/IEC 27001 as the management-system requirements baseline and ISO/IEC 27002 as the reference control set; map HoliCASE ComplianceControls to these controls (and document tailoring explicitly).
- **Secure development baseline:** require secure software development practices as engineered controls (not only policy); use NIST SSDF as the reference for SSDLC practices and tasks.
- **Verification depth:** for application security verification requirements and test depth, use OWASP ASVS as a technical verification reference; track ASVS level selection per component/scope.
- **Maturity and roadmap:** use OWASP SAMM to structure capability maturity, improvement roadmaps, and evidence of sustained practice (automation-ready governance).
- **Threat-driven linking:** threat models are mandatory for high-criticality scope; link threats → controls → implementations → evidence.
- **LLM retrieval hint:** search for “ISO 27001 requirements clauses”, “ISO 27002 control guidance attributes”, “NIST SSDF practices tasks”, “OWASP ASVS v5 levels”, “OWASP SAMM practices maturity”.

**References:**  
[:contentReference[oaicite:12]{index=12}22 overview (ISMS requirements).   
:contentReference[oaicite:13]{index=13}022 overview (control guidance). :contentReference[oaicite:14]{index=14}0-218 (SSDF v1.1).   
[4]:contentReference[oaicite:15]{index=15} page (stable release guidance).   
:contentReference[oaicite:16]{index=16}model references).   

---

### 9.5 Data governance, privacy, and AI governance policy
- **Purpose:** ensure lawful, auditable handling of data (including imported “foreign data”) and accountable AI usage.
- **Legal baseline (EU):** treat the official EU legal text of GDPR as authoritative for personal-data obligations; model obligations at clause level and apply scoping/tailoring explicitly (especially territorial scope, roles, legal bases, and data subject rights).
- **Privacy management system:** use ISO/IEC 27701 as the reference for privacy information management (PIMS) as an extension to ISMS; map privacy controls and evidence expectations.
- **AI management system:** use ISO/IEC 42001 as the governance baseline for AI management (responsible development/use, accountability, transparency, risk management integration).
- **AI risk framing:** use NIST AI RMF for risk taxonomy and operational functions (Govern/Map/Measure/Manage) and its playbook for action patterns and documentation expectations.
- **Data lineage & provenance:** require dataset lineage and processing provenance using PROV semantics; record sources, transformations, and responsible agents; bind evaluation datasets and results to baselines.
- **LLM retrieval hint:** search for “GDPR official text articles and recitals”, “ISO 27701 PIMS requirements guidance”, “ISO 42001 AI management system requirements”, “NIST AI RMF Govern Map Measure Manage”, “PROV-O wasDerivedFrom wasGeneratedBy”.

**References:**  
[1] GDPR officia:contentReference[oaicite:17]{index=17}-Lex (Regulation (EU) 2016/679).   
[2] ISO/IEC 27:contentReference[oaicite:18]{index=18}PIMS requirements and guidance).   
[3] I:contentReference[oaicite:19]{index=19}verview (AI management systems). :contentReference[oaicite:20]{index=20}companion playbook. :contentReference[oaicite:21]{index=21}V-O (provenance representation).   

---

### 9.6 Release governance & certification readiness policy
- **Purpose:** make release claims reproducible, attestable, and acceptable under external audit.
- **Baseline anchoring:** every release and every audit run must reference (a) BaselineSnapshot, (b) ToolchainBaseline, (c) EnvironmentBaseline, and (d) EvidencePackage; conclusions are valid only for that tuple.
- **Version semantics:** release artifacts and public APIs must follow explicit versioning semantics; Semantic Versioning is the default reference pattern.
- **Assessment reproducibility:** audit outputs must be re-generatable from the referenced baselines; assessment traversals must record the traversal definition version and rule-engine versions/configs used.
- **Supply-chain readiness:** every release ships with SBOM + provenance attestations + transparency/signature evidence (unless waived with compensations and residual risk acceptance).
- **Report conformance:** when an authority requires machine-ingestible outputs, AuditReportInstances must conform to the declared template + schema; store report hashes and signer identity for integrity and non-repudiation.
- **LLM retrieval hint:** search for “SemVer precedence rules”, “SLSA provenance requirements”, “SPDX SBOM fields”, “Rekor verify proof of entry”.

**References:contentReference[oaicite:22]{index=22} Versioning 2.0.0 specification.   
[2] SLSA provenance :contentReference[oaicite:23]{index=23}enance content and progression).   
[3] S:contentReference[oaicite:24]{index=24} standardization).   
[4] sigstore Rekor doc:contentReference[oaicite:25]{index=25}and verification). :contentReference[oaicite:26]{index=26}  

---

## 10. Implementation roadmap (non-normative)
Non-normative guidance; not part of the ontology.
1) **Freeze the 4LC Spine:** The 8 Superclasses and their 4LC Members are the immutable ontology of the project.
2) **Implement normative ingestion** as Document + Version + Clause; allow optional AtomicStatement only by profile.
3) **Implement disposition layer** (applicability, tailoring, interpretation, waiver, compensation, residual risk).
4) **Implement control layer** (controls + implementations) and enforce: every applicable clause maps to control or disposition.
5) **Implement assessment/reporting layer**:
   - AuditTraversalDefinition (scope + basis + decision logic)
   - AuditRun bound to BaselineSnapshot + ToolchainBaseline + EvidencePackage
   - ReportTemplate/Schema/Instance + Findings + CorrectiveAction closure
6) **Implement change-impact engine** using edgeState + impactPolicy; enforce bounded propagation and explainability.
7) **Implement auditor-grade queries** (as first-class traversals):
   - compliance by program/scope/baseline,
   - open findings and remediation status,
   - waivers/compensations/residual risks with expiry,
   - conflicts and resolutions,
   - tool/environment qualification coverage where required.
8) **Harden provenance** for all generated/derived artifacts using standard provenance semantics; persist generation context and governance policy version.
9) **Define profiles** (sector/process) that toggle stricter requirements (e.g., tool qualification, formal methods, independence of reviews).
10) **Stop condition for “audit-ready v1”**:
    - one standard set imported at clause granularity,
    - controls mapped and evidenced,
    - one full AuditRun produces a schema-conformant report with findings and dispositions,
    - change-impact correctly triggers revalidation requirements.

---

## 11. Audit readiness criteria (normative policy gate)
Normative acceptance gate; implement as AuditTraversalDefinitions and policy checks.
A project is “qualifiable” under HoliCASE if:
- every applicable clause has (control→evidence→assessment) or a documented disposition,
- every audit run is reproducible from baselines and evidence packages,
- report outputs conform to declared templates/schemas,
- conflicts, waivers, compensations, and residual risks are explicit and reviewable,
- provenance and authorship are recorded for all critical artifacts and generated outputs,
- change impact reliably identifies what must be revalidated.
