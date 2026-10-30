---
name: agents-workflow
description: Describes the workflow I usually follow with agents working on TabUI.
---

# Workflows

These are subagent setups that I usually use to work on TabUI.

Core idea:
**Minimize the changes you make and delegate as much as possible to subagents.**

# Review guidelines

A big part of these setups is **review**. Its purpose is to assess implementation
and test code for:

- **Real** bugs/regressions. Bugs/issues that occur only in extreme/rare conditions
  that normal usage can't trigger can be discarded.
- Architectural flaws.
- Adherence to code style documentation/skills the repo has and
  general coding principles.
- (Tests) Adherence the principles of TDD and the `/tdd` skill if the
  repo has it. High scrutiny must be applied to new tests, especially new e2e tests.

Any time any of the setups below mention a review agent, it should perform the
review according to the guidelines above.

## Tiny fixes/experimentation

In this setup only 1 subagent is run. Its whole purpose is to fix a bug and/or
change code with experimentation purposes. As such, verification here is usually
bypassed. A small test run is OK, but full blown verification should be avoided.

## Small work

This setup is used for small complexity work and uses the following subagents:

- **One agent** to explore the problem and implement the best solution.
- **One agent** to review the implementation.
- **One agent** to address any findings the reviewer found.

## Small work loop

Runs the small size work setup in a loop until the reviewer finds no issues.
**Do not** use this setup unless explicitly asked by the user.

## Medium work

This setup is used for medium complexity work and uses the following subagents:

- **One agent** to explore the problem & find the best solution.
- **One agent** reviews the solution.
- **One agent** to implement the solution.
- **One agent** to review the implementation.
- **One agent** to address any findings the reviewer found.

## Medium work loop

Runs the medium size work setup in a loop until reviewers find no issues.
**Do not** use this setup unless explicitly asked by the user.

## Large work

Very similar to medium work. Does not add new steps; instead increases
the subagent count in certain steps.

This setup is used for high complexity work and uses the following subagents:

- **1-3 agents** to explore the problem & find the best solution.
- **1-3 agents** review the proposed solution, address any issues
  and formulate the final solution plan.
- **One agent** to implement the solution.
- **1-3 agents** to review the implementation.
- **One agent** to address any findings the reviewer found.

## Large work

Runs the large size work setup in a loop until reviewers find no issues.
**Do not** use this setup unless explicitly asked by the user.

# Setup choice

Unless explicitly told by the user which setup to use, choose the one you think
best fits the problem at hand. You can also use a slightly modified version of any
setup. Always inform the user which setup you chose.

**Never** trigger looped setups unless explicitly asked by the user.
