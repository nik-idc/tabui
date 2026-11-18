---
name: doc-review
description: Reviews TabUI documentation changes for need, length, fit, and human readability. Use when writing or reviewing docs, READMEs, or long doc comments, or when the user asks for a docs review.
---

# Doc review

Docs must be clear, concise, and informative, and above all easy for a person
to read. Review each docs change as a human reader would, not as a checklist.

## Questions to answer

For each changed section, answer these questions:

1. **Is it needed?** Does a reader need this to use or change TabUI? Remove
   text that only restates the code, describes how something was built, or
   repeats another doc. Link to the other doc instead.
2. **Is it too long?** Can a sentence go without losing anything a reader
   needs? Prefer one clear example over several paragraphs.
3. **Is there too much information?** Keep internal details, edge cases that
   normal use can't reach, and history out of user-facing docs.
4. **Does it fit the file?** Check that the section matches the purpose and
   reader of the file it is in. For example, `docs/embedding.md` is for hosts
   that embed TabUI. Move content to the right file if it belongs elsewhere.
5. **Is it readable?** Read it once from top to bottom as a new reader. Check
   that the order makes sense, terms are explained or linked before they are
   used, and nothing needs a second read.

## Style

Follow the Google developer documentation style and the repo's
communication rules:

- Use simple English, short sentences, and active voice.
- Address the reader as "you".
- Start with what the reader must do or know, then explain why.
- Use code blocks for anything a reader would copy.
- Use lists or tables only when they are easier to scan than prose.

## Output

Report findings per section: what to cut, what to move, and what to rewrite.
Give the proposed text for each rewrite. If a section is fine, say so in one
line. Don't pad the review with praise or restate the diff.
