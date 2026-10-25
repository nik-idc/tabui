# Code Style

These rules apply to all TabUI contributors.

ESLint enforces additional rules in [`eslint.config.mjs`](../eslint.config.mjs).
Run `npx eslint .` to check them.

## TypeScript and Imports

- Keep strict type checking enabled in `tsconfig.json`.
- Prefer `unknown` for unvalidated input. Narrow it with runtime checks before
  use.
- Prefer enums for finite named value sets. Use types or interfaces for object
  shapes, unions of structurally different objects, and composition.
- Prefer named exports. Use barrel exports where they improve discoverability.
  For internal module boundaries, prefer direct imports over broad barrels.
- Do not use `forEach` - prefer `for (const elem of arr)` syntax
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
  private _before: RemoveBarsBefore;
}
```

## Formatting

- Follow [`.prettierrc`](../.prettierrc) for formatting. Run `npm run format`
  to format the repository.
- Keep `for`, `if`, and similar control-flow headers on one line. If a header
  becomes too long, extract local variables before the statement.
- `if`, `for` etc should always be a `{}` block - never use the short one-liner version
- Prefer one-letter callback parameters for internal array operations.
- Use early returns/guard clauses whenever possible to reduce indentation as much as possible.

```ts
array.find((v) => v.property === neededProp);
```

## Readability and Structure

- Keep behavior changes small and verifiable with tests. During stabilization,
  prefer correctness and clarity over broad refactors.
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
const object = await fetch(someLink);
const parser = new CustomObjectParser();
const formatted = await parser.parse(object);
const response = `some whole lotta text that really should probably be split but since I don't care for readability I will keep this 150+ characters string as is cause why not`;
const responseObject = new CustomObject(response);
const result = await fetch(someLink, {
  method: "POST",
  body: JSON.stringify(responseObject.toJSON()),
});

// Do
const object = await fetch(someLink);

const parser = new CustomObjectParser();
const formatted = await parser.parse(object);

const response =
  `some whole lotta text that really should probably be split ` +
  `but since I don't care for readability I will keep this 150+ characters ` +
  `string as is cause why not`;
const responseObject = new CustomObject(response);

const result = await fetch(someLink, {
  method: "POST",
  body: JSON.stringify(responseObject.toJSON()),
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
