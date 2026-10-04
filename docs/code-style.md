# Code Style

These rules apply to all TabUI contributors.

## TypeScript and Imports

- Keep strict type checking enabled in `tsconfig.json`.
- Avoid `any`, non-null assertions (`!`), and type assertions (`as`). Prefer
  types, narrowing, and runtime checks that prove a value is valid.
- Prefer enums for finite named value sets. Use types or interfaces for object
  shapes, unions of structurally different objects, and composition.
- The demo's `vite.config.js` defines the `@/` alias. Package source and output
  must not depend on that demo-only alias.
- Prefer named exports. Use barrel exports where they improve discoverability.
  For internal module boundaries, prefer direct imports over broad barrels.

## Names and Formatting

- Use PascalCase for classes and interfaces.
- Use camelCase for variables, methods, and properties.
- Prefix private fields with an underscore, for example `_trackElement`.
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

## Documentation

- Document all new functionality with concise JSDoc. Prefer one or two
  sentences that explain its behavior.
- Add inline comments when the logic is not obvious. Explain the reason for
  the choice rather than restating the code.
