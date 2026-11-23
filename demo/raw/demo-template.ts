/**
 * Markup for the demo controls, editor host, and sample credits.
 * `%ASSET_BASE%` is replaced with the folder that holds `samples/`.
 */
export const DEMO_TEMPLATE = `
<div class="demo-toolbar">
  <label class="demo-field">
    <span>Score</span>
    <select id="fixture-select"></select>
  </label>
  <label class="demo-field">
    <span>Theme</span>
    <select id="theme-select"></select>
  </label>
  <label class="demo-field">
    <span>Sound</span>
    <select id="sound-source-select">
      <option value="fluidr3">FluidR3</option>
      <option value="samples">Free Wave Samples</option>
      <option value="synths">Synth</option>
    </select>
  </label>

  <fieldset class="demo-segmented">
    <legend class="demo-visually-hidden">Mode</legend>
    <label><input type="radio" name="interaction-mode" value="edit" />Edit</label>
    <label><input type="radio" name="interaction-mode" value="view-only" />View only</label>
  </fieldset>
  <fieldset class="demo-segmented">
    <legend class="demo-visually-hidden">Layout</legend>
    <label><input type="radio" name="layout-mode" value="wrapped" />Wrapped</label>
    <label><input type="radio" name="layout-mode" value="single-line" />Single line</label>
  </fieldset>

  <details id="panels-menu" class="demo-menu">
    <summary class="demo-button">Panels</summary>
    <div class="demo-menu-content">
      <fieldset>
        <legend>Score panel</legend>
        <label class="demo-field">
          <span>Visibility</span>
          <select id="score-panel-visibility-select">
            <option value="default">Default</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label class="demo-field">
          <span>Placement</span>
          <select id="score-panel-placement-select">
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Side panel</legend>
        <label class="demo-field">
          <span>Visibility</span>
          <select id="side-panel-visibility-select">
            <option value="default">Default</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label class="demo-field">
          <span>Placement</span>
          <select id="side-panel-placement-select">
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>
        <label class="demo-check">
          <input id="side-panel-collapsible" type="checkbox" />Can collapse
        </label>
        <label class="demo-check">
          <input id="side-panel-collapsed" type="checkbox" />Start collapsed
        </label>
      </fieldset>
    </div>
  </details>

  <button id="deserialize-score" class="demo-button" type="button">Open file</button>
  <button id="serialize-score" class="demo-button" type="button">Save file</button>
  <input id="score-file" type="file" accept=".json,.tabui.json,application/json" hidden />
  <div class="demo-exchange" role="group" aria-label="Import and export">
    <label class="demo-field">
      <span>Format</span>
      <select id="exchange-format-select">
        <option value="musicxml">MusicXML</option>
      </select>
    </label>
    <button id="import-score" class="demo-button" type="button">Import</button>
    <button id="export-score" class="demo-button" type="button">Export</button>
  </div>
  <input id="exchange-file" type="file" accept=".musicxml,.xml" hidden />
  <button id="reset-demo-settings" class="demo-button demo-button-quiet" type="button">Reset</button>

  <div
    id="score-persistence-status"
    class="demo-status"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  ></div>
</div>

<div id="tabui-editor" class="demo-editor"></div>

<p class="demo-credits">
  Samples: FluidR3 by Frank Wen and contributors
  (<a href="%ASSET_BASE%samples/fluidr3/COPYING">MIT license</a>,
  <a href="%ASSET_BASE%samples/fluidr3/README.md">preparation notes</a>).
  Free Wave Samples recorded by Jason Champion, from
  <a href="https://freewavesamples.com/">freewavesamples.com</a>
  (<a href="https://freewavesamples.com/about-us-license">license</a>).
</p>
`;
