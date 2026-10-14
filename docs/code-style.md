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

## Formatting

- Follow [`.prettierrc`](../.prettierrc) for formatting. Run `npm run format`
  to format the repository.
- Keep `for`, `if`, and similar control-flow headers on one line. If a header
  becomes too long, extract local variables before the statement.
- Prefer one-letter callback parameters for internal array operations:

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

## Documentation

- Document all new functionality with concise JSDoc. Prefer one or two
  sentences that explain its behavior.
- Add inline comments when the logic is not obvious. Explain the reason for
  the choice rather than restating the code.
