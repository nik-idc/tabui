# React integration and demo

This fixture is a small React 19.3.1 application. It is both the automated
integration consumer and a runnable example. It installs TabUI from a locally
packed npm tarball and uses only public package exports.

## Run the demo

From the repository root, after `npm ci`:

```sh
npm run demo:react
```

This builds TabUI, installs the consumer in a temporary directory, checks its
types, and starts Vite at `http://127.0.0.1:5174`. Press Ctrl+C to close the server
and remove the temporary installation. The example source stays in `fixture/`.

Use the editor to select tracks and edit notation. The React controls resize,
unmount, remount, and switch the complete light/dark theme. Each theme pairs
matching icons with UI backgrounds, text, controls, and notation colours. The
status fields show public change events and React effect setup/cleanup counts.

The practice planner is a controlled React form with a live preview, validation,
a pace selector, optional notes, and a saved-session list. Try these interactions:

1. Select the second track in TabUI, then type a session title and notes. The
   preview updates on every keystroke. The editor stays mounted, and typing in the
   form does not invoke TabUI keyboard shortcuts.
2. Hide and show the notes field. Its React state keeps the text.
3. Save two sessions and remove one. React updates the keyed list without
   recreating TabUI. Session entries are host-owned metadata, not score edits.
4. Change tracks in TabUI. Its event updates the live React preview while keeping
   the form's inputs and saved sessions.
5. Switch themes or unmount/remount TabUI. The form remains usable and keeps its
   state. Restart `npm run demo:react` to load fixture changes into a new install.

## Run the integration test

```sh
npm run build:package
npm run test:react-integration
```

The consumer has its own TypeScript configuration and installed React, React DOM,
types, TypeScript, and Vite. The test checks both Vite development mode and a
production build in Chromium. Development mode must exercise Strict Mode's
setup → cleanup → setup cycle; a production-only test would miss that cycle.

Checks cover:

- Public package types and the production build.
- Visible notation, imported CSS, and decoded light/dark icons without hosting
  asset files.
- Editor events updating React state, and React controls calling the editor API.
- Parent rerenders preserving the mounted editor and its selection.
- Form keystrokes, validation, submission, conditional fields, and keyed-list
  updates preserving the notation DOM without causing editor change events.
- TabUI events updating the form preview without resetting controlled inputs.
- Cleanup emptying the detached editor host, followed by a working remount.
- A single event notification after remounting.
- Theme changes in both directions updating visible UI/notation colours and icons,
  while keeping the score and React form state.
- Browser errors, React errors, and failed network requests.

## Lifecycle pattern

`fixture/tabui.tsx` uses a ref for the host element and an effect for the editor.
Each effect setup creates a fresh `TabUIEditor`. Cleanup unsubscribes and disposes
that instance. A disposed instance cannot be reused during Strict Mode's next
setup.

React owns the host element; TabUI owns its children. The host callbacks are
stable (`useCallback`), so normal React state updates do not recreate the editor.
The score is also stable and remains owned by the React application. Changing the
theme intentionally recreates the editor and resets its UI selection.

These checks support the tested React/Vite workflow. Other React versions,
server-side rendering, hydration, and application-specific layouts need their
own checks; this fixture is a client-rendered example.
