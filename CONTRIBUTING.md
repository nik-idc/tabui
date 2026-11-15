# Contributing to TabUI

TabUI welcomes any kind of contribution, such as bug reports, feature ideas, docs
fixes, accessibility feedback, and code.

Before you start a large change, such as a new feature or a big refactor, open an
issue to discuss it first. Check the [Roadmap](ROADMAP.md) to see where the
project is going. This way, nobody spends time on work that may not be accepted.

Please keep in mind that I am one person working on this in my free time, so
it may take a while for me to respond.

## Setup

Use a supported Node.js LTS release (20.19+, 22.12+, or 24+) and npm.

```sh
npm ci
npx playwright install --with-deps chromium firefox
npm run dev
```

The demo opens at `http://localhost:5173/tabui/`.

See [Development](DEVELOPMENT.md) for focused test commands, framework demos, and
the repository layout.

## Submitting a PR

If your PR changes code or tests, run `npm run verify` before you open it. This
command is the final verification gate. It catches most problems, but not all of
them.

Keep each PR focused on one change. Keep the description short but complete. Use
Markdown: paragraphs, lists, and code blocks, not one long block of text.

## Principles

Keep these principles in mind when you design and build any change:

- **Embeddability and isolation.** TabUI must work inside any web app. Each
  instance is fully self-contained and must not affect other instances on the
  same page.
- **Customizability.** Users can change themes, icons, and samples.
- **Performance.** Edits must stay fast, even in large scores. Each edit reports
  which parts of the score it changed, and TabUI updates only those parts. Keep
  it that way.
- **Accessibility.** The mouse and the keyboard are equal input methods:
  - Every action needs both a mouse control and a keyboard shortcut.
  - New and updated actions need screen reader announcements.

Saved scores must stay readable. New fields in the score format must be optional,
so older files still load. A breaking format change needs a new schema version and
a migration from the previous one.

## AI policy

You can use AI to contribute to TabUI. If you do:

- Say in the PR description if AI wrote a large part of the code.
- Make sure you understand the code you submit.
- You are responsible for your changes, not your AI tool.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
