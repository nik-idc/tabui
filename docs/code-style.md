# Code Style

These rules apply to all TabUI contributors.

ESLint enforces additional rules in [`eslint.config.mjs`](../eslint.config.mjs).
Run `npm run lint` to check them.

## Naming

- Name boolean variables so they read as yes/no, for example `isMixed`,
  `hasNotes`, or `selected`. The name should make it clear that the value is a
  boolean. For example:

```ts
// Bad. Could technically mean a collection that is a result of a mix
// or something of that sort
const mixed = bars.some((v) => !v.isEqualTimeSig(bars[0]));

// Good
const isMixed = bars.some((v) => !v.isEqualTimeSig(bars[0]));
```

## TypeScript and Imports

- Keep strict type checking enabled in `tsconfig.json`.
- Prefer `unknown` for unvalidated input. Narrow it with runtime checks before
  use.
- Prefer enums for finite named value sets. Use types or interfaces for object
  shapes, unions of structurally different objects, and composition.
- Prefer named exports. Use barrel exports where they improve discoverability.
  For internal module boundaries, prefer direct imports over broad barrels.
- When a class property has an object type that doesn't fit in one line consider
  extracting it into a small type. Example:

```ts
// Don't
class RemoveBarsCommand {
  private _before: {
    bars: MasterBarArrayOperationOutput[];
    neighborSnapshots: BeatSnapshot[];
  } | null = null;
}

// Do
type RemoveBarsBefore = {
  bars: MasterBarArrayOperationOutput[];
  neighborSnapshots: BeatSnapshot[];
} | null;

class RemoveBarsCommand {
  private _before: RemoveBarsBefore = null;
}
```

## Formatting

- Follow [`.prettierrc`](../.prettierrc) for formatting. Run `npm run format`
  to format the repository.
- Keep `for`, `if`, and similar control-flow headers on one line. If a header
  becomes too long, extract local variables before the statement.
- Prefer one-letter callback parameters for internal array operations:

```ts
array.find((v) => v.property === neededProp);
```

- Use early returns and guard clauses to reduce indentation.

## Readability and Structure

- Keep behavior changes small and verifiable with tests.
- Fix the root cause, not the symptom. If that needs a small or medium refactor,
  include it in the change. If it needs a large refactor, discuss it first in an
  issue.
- Keep related behavior close together. Inline a one-use helper or getter that
  only wraps a simple property access, such as `return this._foo?.bar;`.
- Extract logic when it is reused, needs a meaningful name, or is complex enough
  that the abstraction improves readability.
- Use named local variables to make long expressions easier to read:

```ts
const labelWidth = measureLabel(label, fontSize);
const labelX = barX + barWidth - labelWidth;
element.setAttribute("x", labelX.toString());
```

- Structure the code in logical blocks. Example:

```js
// Don't
const response = await fetch(sourceUrl);
const parser = new ScoreParser();
const score = parser.parse(await response.json());
const document = serializeScore(score);
const result = await fetch(targetUrl, {
  method: "POST",
  body: JSON.stringify(document),
});

// Do
const response = await fetch(sourceUrl);

const parser = new ScoreParser();
const score = parser.parse(await response.json());

const document = serializeScore(score);
const result = await fetch(targetUrl, {
  method: "POST",
  body: JSON.stringify(document),
});
```

## Editing Responsibilities

- Model classes own local operations and keep their local data valid.
- `ScoreEditor` owns complex edits and business rules that span models and do
  not naturally belong to one model, such as building tie chains across beats.
- Commands delegate those edits to `ScoreEditor`, report affected model anchors,
  and save and restore state for undo and redo. Keep edit rules out of commands.
  Save state before any affected model changes, and use fixed saved state for
  redo when repeating the edit would run selection or search rules again.

## Documentation

- Document all new functionality with concise JSDoc, preferably one or two
  sentences that explain its behavior. All new state must have a short `/** */`
  comment explaining what it is and why it is needed.
- Add inline comments when the logic is not obvious. Explain the reason for
  the choice rather than restating the code.
