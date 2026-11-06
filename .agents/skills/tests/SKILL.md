---
name: tests
description: Criteria for a good test in TabUI
---

Consider this an addition to the `/tdd` skill. Use this when writing new tests
or analyzing/assessing/changing existing tests.

This skill is designed to answer if a test is a **good test**.

A good test answers "Yes" to all 4:

- Does this behavior deserve coverage?
- Is the coverage itself **good**? (Refer to `/tdd` & general testing principles
  to determine if coverage is **"good"**)
- Is the coverage placed appropriately? I.e. does it truly belong to the
  file/folder it's currently in?
- Is this coverage unique and non-repeating? Meaning - are you **sure** this
  assertion/test isn't already implemented somewhere else?

Be critical of new tests (especially the "regression" tests modern LLMs love
shoving any time anything changes). Do not be afraid of removing existing tests.
