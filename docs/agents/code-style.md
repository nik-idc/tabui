# Code Style

Repository-specific rules for editing or reviewing source code.

- **Classes / Interfaces**: PascalCase
- **Variables / Methods / Properties**: camelCase
- **Private fields**: underscore prefix (e.g., `_trackElement`)
- **Formatting**:
  - double quotes
  - semicolons
  - 2-space indentation
  - line width 80
- Keep `for`, `if`, and similar control-flow headers on one line. If the header
  would become too long, extract local variables before the statement rather
  than splitting the header across lines.
- Prefer correctness and clarity over broad refactors during
  stabilization-focused work.
- Prefer locality of behavior. Do not introduce trivial one-line
  getters/helpers that only wrap a simple property access used in one place.
- If a getter or helper would be a single obvious line such as
  `return this._foo?.bar;`, prefer inlining that expression at the call site
  instead of creating a dedicated method.
- Extract only when the logic is reused, meaningfully named, or complex enough
  that the abstraction improves readability.
- Avoid adding comments unless the logic is non-obvious.
- Document **all** new functionality using JSDoc. Keep it concise, simple, and
  informative. Prefer one or two sentences that clearly explain the function.
