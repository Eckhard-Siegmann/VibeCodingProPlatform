#From Chatbot to Operating System
by Eckhard Siegmann, Jan 2026

Stop viewing GenAI as only chatbots. Start using GenAI as an operating system. Frontier LLMs are trained to act as agents for over a year—embrace this transition!

With this mindset, prompt engineering fades into the background. What really matters: clear requirements, tests, and acceptance criteria. DSPy showed us: we can optimize prompts automatically based on requirements and tests. I am taking this further: why stop at prompts? Let's treat entire skills and agents as optimizable artifacts—applying DSPy principles to the full package!

A skill isn't just a prompt. The scripts, tool call integrations, retrieval configuration, schemas, guardrails, and output constraints are digital artifacts, all testable, and optimizable against tests. The complex nature of skills in their versioned collection of files translates into testing complexity - each artifact in the skill needs tailored tests. 

Through conversations with Andre Machon, a powerful insight emerged: an agent only needs a handful of these DSPy-style-optimized work-skills, plus one important meta-skill: orchestration. This meta-skill selects the right skill, sequences it correctly, tunes inputs, and iterates when needed. And yes, orchestration itself can be defined through end-to-end requirements, tests, and acceptance criteria.

The result? An agent built entirely on requirements-driven optimization—one you can fully automatically migrate to a new LLM from the inside out. No prompt rewriting. Just re-optimize against the same tests. Performance becomes reproducible, improvements measurable, failures diagnosable, and governance finally realistic.