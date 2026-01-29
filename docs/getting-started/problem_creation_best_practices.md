# Problem Creation Best Practices

This guide helps you create effective Problem Cards for the agentic coding meetup, tailored for professional software developers, data scientists and engineers. Whether you have a polished specification or just a wild idea, there's a place for you here.

---

## 1. Pros for Pros: Our Philosophy

This meetup is built on **trust and low barriers**.

- **Experienced practitioners need little context** – we assume competence
- **No long PRDs required** – unless you want precise benchmarking
- **Collaboration is your ally** – rough ideas can be shaped together
- **Transparency over formality** – we learn from each other's approaches

You don't need permission to experiment. You don't need a perfect specification. You need curiosity and willingness to share what you learn. Bring your own problem *BYOP* is the core of the Meetup. Challenge your own meta reflections on how clear you present a problem. Problem Owners do not code their own problem - they watch others with their individual approaches using different platforms, agents and tools. Artifacts created in the meetup shall help everyone to improve the own productivity and quality. The platform incorporates questionaires for problem pitches and code reviews. Constistent data gathering allows for longitudinal studies and will become a data goldmine for agents we will build in later meetups. 

---

## 2. The Spectrum of Problem Readiness

All of these are valid starting points:

### Exploratory / Wild Ideas
- You have a hunch, an intuition, something you want to try
- Not yet testable? That's fine
- The problem isn't fully formed? The team can help refine it
- **This is how innovation starts**

### Minimal Viable Problem
- Clear enough that someone could start coding
- "Build X that does Y" level of specificity
- No detailed acceptance criteria needed
- **Good enough for a productive session**

### Well-Specified with Test Cases
- Full PRD with clear requirements
- Defined test cases or acceptance criteria
- Reproducible environment
- **Ideal for benchmarking different agentic tools**

The more specified your problem, the easier it is to compare approaches across Cursor, Claude Code, Codex, Antigravity, or other frameworks. But don't let that stop you from submitting rough ideas. Meetup participants who selected your problem sit next to you or are in a breakout room you arrange for them. While answering open questions you get a good feedback what you forgot to clarify upfront.

---

## 3. Problem Complexity Levels

### Greenfield
Fresh start, no existing code constraints.
- Currently **best suited** for the meetup
- Clear scope, measurable outcomes
- Most agentic tools excel here

### Advanced Greenfield
Some greenfield code and auxiliary artifacts already exist
- APIs, external services, architectural decisions
- Requires more context in the problem description
- **Growing capability** of the meetup community

### Brownfield
Existing codebase, legacy constraints, real-world messiness.
- This is where **real professional value** lies
- Currently challenging for most agentic tools
- The meetup **aims to tackle these** as we collectively improve
- If you have a brownfield problem, bring it – we'll learn together

**Our vision**: The community grows together to solve increasingly complex problems. Today's impossible brownfield challenge becomes next year's solved pattern. Important artifacts can be improved over multiple meetups.

---

## 4. Writing Your Problem Card

A **Problem Card** describes the challenge you bring to the meetup.  
It does not need to be perfect — it needs to be **clear enough to evaluate and compare**.

### Required fields

- **Title**  
  Short, descriptive name of the problem.

- **Problem description**  
  What is the core challenge? Keep it brief (2–5 sentences).

- **Why it matters**  
  Why is this problem interesting, useful, or worth solving?

- **Repository URL (GitHub)**  
  The main repository participants will work with.

- **Problem type**  
  One of:
  - Explorative  
  - Greenfield (Early)  
  - Greenfield (Advanced)  
  - Brownfield  

- **Task structure (number)**  
  If your problem is monolithic, try to break it down to prioritized sub-tasks or tickets. This makes it easier to compare partial solutions.

### Optional but helpful

- Constraints or non-goals    
- Links to docs, demos, or issues  
- Notes and test cases on how success could be judged

### Versioning note

Once submitted, your Problem Card is locked. 
If you improve the description or the repository later, create a **new version**.  
Older versions stay visible for comparison.

---

## 5. Repository Setup

**Minimal** (always required):
- Working GitHub repository link
- Requirements and code are accessible to the public

**Better**:
- README with setup instructions
- Dependencies documented

**Best** (for benchmarking):
- Reproducible environment (Docker, devcontainer, nix)
- Test suite that can verify solutions
- Clear "run this to check if it works" command

---

## 6. Documenting Your Tooling (PR Template)

When you submit a solution via Pull Request, we encourage you to document your tooling setup. This is **not mandatory**, but it's how we all learn.

### Why document your tooling?
- Enables comparison: same problem, different approaches
- Helps others learn what works
- Builds collective knowledge about agentic development

### Suggested PR description sections:

```markdown
## Solution Summary
[Brief description of your approach]

## Tooling Used
- **Primary Agent/Assistant**: [e.g., Claude Code, Cursor, Codex]
- **Model**: [e.g., Claude Opus 4, GPT-4, etc.]
- **Orchestration**: [e.g., direct prompting, custom workflow, framework]

## What Worked Well
[Techniques, prompts, or approaches that were effective]

## What Didn't Work
[Dead ends, limitations encountered]

## Time Spent
[Rough estimate: setup, iteration, refinement]

## Would You Use This Approach Again?
[Honest reflection]
```

This template is a suggestion, not a requirement. Share what feels useful.

---

## 7. Tips for Competitive Agentic Coding

When multiple people tackle the same problem with different tools:

- **Same problem, different approaches = valuable data**
- Document your iterations, not just final results
- Failed attempts are learning opportunities
- Be honest about what the tool did vs. what you did
- Share prompts that worked (and didn't)

**Comparing tools fairly:**
- Start from the same problem description
- Note your prior familiarity with each tool
- Track time and iteration count
- Consider: would this scale to larger problems?

---

## 8. Common Pitfalls to Avoid

### Over-specifying when exploring
If your goal is to explore an idea, don't force a detailed spec. You'll constrain the interesting directions.

### Under-specifying when benchmarking
If you want to compare tools fairly, vague requirements lead to incomparable solutions.

### Forgetting to save your private URL
The private URL is your edit key to the Problem Card. Bookmark it. We also send it to your email, but save it somewhere safe.

### Waiting for the "perfect" problem
Submit the rough idea. The community can help shape it. Perfect is the enemy of interesting.

### Not documenting your tooling
Your PR teaches others nothing if it's just code. The journey matters as much as the destination.

---

## 9. Getting Help

- **Before the meetup**: Moderators can help refine rough ideas
- **During the meetup**: Ask questions, pair up, learn together
- **After the meetup**: Review stays open – add reflections later

This is a community of practitioners helping each other get better at working with AI. Your contribution – whether polished or rough – makes us all stronger.

---

*Pros for Pros. Low barriers. High trust. Let's build something interesting.*
