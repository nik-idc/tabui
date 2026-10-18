# TabUI + Vue

This demo and its integration tests were written entirely by AI. I considered
that appropriate for their purpose as framework integration examples and checks.

This example shows how to use TabUI inside a Vue application, alongside a
practice-planner form. It uses Vue single-file components and the Composition API.

## Run the demo

From the repository root, after `npm ci` (see [setup](../../CONTRIBUTING.md#setup)):

```sh
npm run demo:vue
```

Open <http://127.0.0.1:5176>. The command builds TabUI and installs it with Vue in
a temporary directory. Press Ctrl+C to stop the server and remove that directory.
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

- [`TabUI.vue`](TabUI.vue) creates an editor in `onMounted`, subscribes to its
  events, and unsubscribes and disposes in `onBeforeUnmount`.
- [`App.vue`](App.vue) keeps one `Score`, receives editor events, and manages
  the form with `v-model`.
- [`main.ts`](main.ts) imports the public `@atikincode/tabui/styles.css`
  stylesheet. Import it once as a global stylesheet in your application.

Use `shallowRef` and `markRaw` for the score and editor, as shown in the example.
This lets Vue track references to these objects without turning the library's
internal objects into reactive proxies. Ordinary form values use normal Vue refs.

The parent uses `:key="variant"` to recreate the editor component when the theme
changes, while keeping the same score. The wrapper reads its score and theme
when it mounts; changing these props alone does not rebuild the editor. If you
replace the score, also remount the component or change its key.

## Run the integration test

Install Chromium once with `npx playwright install chromium`, or follow the
[browser setup instructions](../../CONTRIBUTING.md#checks). Then run:

```sh
npm run build:package
npm run test:vue-integration
```

The test installs the locally built TabUI package in a separate Vue project.
It checks TypeScript and Vue templates with `vue-tsc`, builds with Vite, and uses
Playwright to test this app in Chromium against both development and production.

Checks include:

- Typing, validation, conditional fields, and list updates without resetting
  the editor or its selection.
- Track events, layout refresh, cleanup, and remounting without duplicate events.
- Light/dark colours and bundled icons, with no separately hosted icon files.
- Note edits surviving theme changes.
- Browser, Vue, and network errors.

This is a client-rendered example. See the [usage guide](../../docs/usage.md#framework-integration)
for shared lifecycle guidance and the other framework examples.

## Versions

The test installs Vue **3.5.44**, vue-tsc **3.3.13**, and the official
`@vitejs/plugin-vue` **5.2.4**, which supports the repository's Vite 6.
Vite and TypeScript use the exact versions installed in the repository (currently
TypeScript 5.9). The Vue plugin is installed in the temporary project too.
