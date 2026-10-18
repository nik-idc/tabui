# TabUI + Angular

This demo and its integration tests were written entirely by AI. I considered
that appropriate for their purpose as framework integration examples and checks.

This example shows how to use TabUI inside an Angular application, alongside a
practice-planner form. Angular manages the form and component lifecycle; TabUI
manages the editor's contents.

## Run the demo

From the repository root, after `npm ci` (see [setup](../../CONTRIBUTING.md#setup)):

```sh
npm run demo:angular
```

Open <http://127.0.0.1:5175>. The command builds TabUI and installs it with Angular
in a temporary directory. Press Ctrl+C to stop the server and remove that directory.
If you edit the example's source files, restart the command to load your changes.

### Things to try

1. Select the second track, then type a session title and practice notes. The
   preview updates without resetting the editor or changing the score.
2. Hide and show the notes field. Its text stays available. Save two sessions,
   then remove one. These entries belong to the practice planner, not the score.
3. Change tracks in TabUI. The preview follows the active track, while the form
   keeps its values.
4. Edit a note, then resize the editor, switch themes, or unmount and remount it.
   Score edits and form values remain. Recreating the editor resets its selection
   and undo history.

The status fields show the active track, layout width, event count, and how many
times the editor has been created and cleaned up.

## Use the pattern in your app

- [`tabui.ts`](tabui.ts) contains `TabUIHost`, the component that connects Angular
  to TabUI. It creates an editor after its host element exists, subscribes to
  events, and unsubscribes and disposes when the component is removed.
- [`main.ts`](main.ts) and [`app.html`](app.html) show how the parent keeps one
  `Score`, receives editor events, and manages the form with `ngModel`.
- [`style.css`](style.css) imports the public `@atikincode/tabui/styles.css`
  stylesheet. Import it once as a global stylesheet in your application.

The example uses Zone.js change detection and template-driven forms. Keep the
score object stable during normal Angular updates. Changing the score input or
theme makes the component dispose the old editor and create a new one.

The `ready` event gives the parent access to the current editor, or `null` after
cleanup. The parent updates its status fields after Angular finishes checking
the current view. The wrapper calls its state event `stateChange` to distinguish
it from ordinary HTML `change` events.

## Run the integration test

Install Chromium once with `npx playwright install chromium`, or follow the
[browser setup instructions](../../CONTRIBUTING.md#checks). Then run:

```sh
npm run build:package
npm run test:angular-integration
```

The test installs the locally built TabUI package in a separate Angular project.
It uses the Angular CLI to compile TypeScript and templates ahead of time (AOT),
with strict checks. Playwright then opens this app in Chromium and tests both
the development server and the production build.

Checks include:

- Typing, validation, conditional fields, and list updates without resetting
  the editor or its selection.
- Track events, layout refresh, cleanup, and remounting without duplicate events.
- Light/dark colours and bundled icons, with no separately hosted icon files.
- Note and track-name edits surviving theme changes.
- Browser, Angular, and network errors.

This is a client-rendered example. See the [usage guide](../../docs/usage.md#framework-integration)
for shared lifecycle guidance and the other framework examples.

## Versions

The test installs Angular framework/compiler **21.2.25**, CLI/build **21.2.27**,
TypeScript **5.9.3**, RxJS **7.8.2**, Zone.js **0.16.0**, and tslib **2.8.1**.
Use a supported LTS Node release: **20.19+**, **22.12+**, or **24+**. This example
was checked on Node **22.22.0**. The builder requires TypeScript `>=5.9 <6.0`.
Vitest **4.0.8** is pinned as an optional builder peer to avoid an npm 10 resolver
crash; the browser tests use Playwright.
