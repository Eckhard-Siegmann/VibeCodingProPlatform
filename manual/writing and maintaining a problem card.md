## 4. Writing and Maintaining a Problem Card

This chapter explains how to write a **Problem Card** in a way that fits the meetup’s evaluation, comparison, and longitudinal learning goals.  
A Problem Card is not just a text description: it is a **versioned, assessable artifact** that connects requirements, repositories, evaluations, and decisions over time.

The guidance below is aligned with the actual **data model**, **assessment workflows**, and **decision processes** used by the platform.

---

### 4.1 What a Problem Card Is (and Is Not)

A **Problem Card** represents *one problem concept* across time.

It consists of:
- A **stable problem identity** (problem)
- One **current major version** (problem_version)
- Zero or more **archived major versions**
- Zero or more **assessments** (by humans or agents)
- A **decision history** documenting all relevant actions

A Problem Card is:
- ✔ Versioned (major versions)
- ✔ Continuously assessable
- ✔ Comparable across time and approaches
- ✔ Linked to a concrete repository state

A Problem Card is **not**:
- ❌ A one-off prompt
- ❌ A static PRD document
- ❌ A final specification that must be “perfect” upfront

---

### 4.2 Core Fields of a Problem Card

Each **major version** of a Problem Card contains structured fields stored explicitly in the database. These fields are locked once submitted and only change via creation of a new major version.

**Required fields**
- **Title**  
  A concise, human-readable name for the problem.

- **Problem Description**  
  A short but clear explanation of the challenge. This should be understandable without opening the repository.

- **Motivation / Value Statement**  
  Why this problem matters. This is explicitly used in later evaluations of *business value* and *general relevance*.

- **Primary Repository URL (GitHub)**  
  The canonical GitHub repository associated with this problem.  
  The platform records the **HEAD commit hash** when a new version is created.

- **Problem Type**  
  One of:
  - Explorative
  - Greenfield (Early)
  - Greenfield (Advanced)
  - Brownfield

- **Task Structure Indicator**  
  A single integer:
  - `1` = monolithic task
  - `>1` = number of independently solvable sub-tasks (tickets)

**Optional but strongly recommended**
- **Secondary URL** (e.g. docs, demo, issue tracker)
- **Constraints / Non-goals**
- **Known risks or ambiguities**
- **Hints on testability or evaluation**

---

### 4.3 Writing for Assessability (Not Perfection)

Problems are evaluated repeatedly:
- by the Problem Owner (self-assessment)
- by moderators (quality gate)
- by participants (pitch & review)
- by agents (pre-evaluation, later automation)

Therefore, write with **assessability** in mind.

Good Problem Cards:
- Make **implicit assumptions explicit**
- Allow reviewers to judge **clarity, complexity, and structure**
- Expose uncertainty instead of hiding it

You are *not* expected to fully specify everything upfront.  
Iteration is expected and explicitly supported via versioning.

---

### 4.4 “Done” Means Comparable, Not Finished

In this meetup format, “done” does **not** mean:
- feature-complete
- production-ready
- optimal

Instead, “done” means:
- the outcome can be **compared** to other approaches
- correctness, simplicity, and elegance can be **discussed**
- trade-offs are **visible**

A flexible definition of “done” is acceptable **as long as it is stated**.

---

### 4.5 Versioning Rules You Must Understand

- Drafts (version 0) are **not persisted** as versions.
- The first submission creates **major version 1**.
- Any later modification requires **creating a new major version**.
- Only **one major version is current** at any time.
- Older versions remain visible and assessable in archive view.
- Rollback is implemented by promoting an older version to a new major version.

Each major version stores:
- the textual fields
- the GitHub HEAD commit hash at creation time
- an optional change comment (similar to a commit message)

This allows longitudinal analysis such as:
> “Version 1 was rejected for clarity; version 2 was accepted.”

---

### 4.6 Assessments Are First-Class Citizens

Every Problem Card can be assessed with **multiple inventories**, for example:
- Problem suitability (ProblemEval)
- Pitch evaluation
- Review evaluation
- Meetup alignment
- Lessons learned (post-event)

Assessments:
- Are always linked to a **problem + major version**
- Record **role**, **context**, **time**, and **presence**
- May be binding or non-binding (recommendations)

You do **not** need to optimize your text for one specific inventory.  
Instead, aim for clarity so *different inventories can extract signal*.

---

### 4.7 Examples (Contextualized)

**Minimal but valid**
> Title: Markdown-to-Blog CLI  
>  
> Description: Convert Markdown files into a static blog.  
>  
> Motivation: Useful baseline task to compare agentic coding workflows.  
>  
> Repository: https://github.com/example/md-blog  
>  
> Problem Type: Greenfield (Early)  
> Task Structure: 1

**Well-structured and highly assessable**
> Title: Markdown-to-Blog CLI  
>  
> Description: Build a CLI tool that converts Markdown files into a static blog.  
>  
> Motivation: Enables comparison of agentic approaches for parsing, code generation, and incremental refinement.  
>  
> Repository: https://github.com/example/md-blog  
>  
> Problem Type: Greenfield (Advanced)  
> Task Structure: 4  
>  
> Subtasks (implicit via task structure):
> - Parse YAML front matter  
> - Render Markdown with syntax highlighting  
> - Generate index page  
> - Implement watch mode  
>  
> Constraints:
> - CLI-only, no web UI  
> - Focus on readability over performance  
>  
> Testability:
> - Example Markdown inputs provided  
> - Expected HTML outputs defined

Both are acceptable.  
The second simply enables **richer comparison and learning**.

---

### 4.8 Final Guidance

- Write for **humans first**, but assume agents will read it too.
- Prefer **clarity over completeness**.
- Treat the Problem Card as a **living artifact**.
- Expect feedback, iteration, and evolution.

A strong Problem Card does not remove ambiguity —  
it **makes ambiguity visible and discussable**.
