import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { Score } from "@atikincode/tabui";
import type { TabUIEditor, TabUIEditorStateSnapshot } from "@atikincode/tabui";
import "@atikincode/tabui/styles.css";
import "./style.css";
import { TabUI } from "./tabui";

type PracticeSession = {
  id: string;
  title: string;
  pace: string;
  notes: string;
  track: string;
};

/** A runnable host app demonstrating state flow and component lifetime. */
export function ReactDemo() {
  const [score] = useState(() => {
    const value = new Score();
    value.addTrack(value.tracks[0].context.instrument, "Second track");
    return value;
  });
  const [mounted, setMounted] = useState(true);
  const [variant, setVariant] = useState<"light" | "dark">("light");
  const [editor, setEditor] = useState<TabUIEditor | null>(null);
  const [activeTrack, setActiveTrack] = useState("Unmounted");
  const [width, setWidth] = useState(1200);
  const [events, setEvents] = useState(0);
  const [setups, setSetups] = useState(0);
  const [cleanups, setCleanups] = useState(0);
  const [title, setTitle] = useState("");
  const [pace, setPace] = useState("Steady");
  const [includeNotes, setIncludeNotes] = useState(true);
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");

  const onReady = useCallback((value: TabUIEditor | null) => {
    setEditor(value);
    if (value === null) {
      setCleanups((v) => v + 1);
      setActiveTrack("Unmounted");
    } else {
      setSetups((v) => v + 1);
      setActiveTrack(value.getState().activeTrack.name);
      setWidth(value.getState().layout.width);
    }
  }, []);
  const onChange = useCallback((state: TabUIEditorStateSnapshot) => {
    setActiveTrack(state.activeTrack.name);
    setWidth(state.layout.width);
    setEvents((v) => v + 1);
  }, []);
  const onError = useCallback((message: string) => setError(message), []);

  return (
    <main className="react-demo" data-theme={variant}>
      <h1>TabUI + React</h1>
      <p>
        React Strict Mode is enabled. Select a track, resize, or remount the
        editor.
      </p>
      <nav aria-label="React host controls">
        <button onClick={() => setMounted((v) => !v)}>
          {mounted ? "Unmount editor" : "Mount editor"}
        </button>
        <button
          disabled={editor === null}
          onClick={() => editor?.refreshLayout(width === 1200 ? 1100 : 1200)}
        >
          Resize editor
        </button>
        <button
          onClick={() => setVariant((v) => (v === "light" ? "dark" : "light"))}
        >
          Use {variant === "light" ? "dark" : "light"} theme
        </button>
      </nav>
      <section className="host-session" aria-label="React practice planner">
        <h2>React practice planner</h2>
        <p>
          This form is owned by React. Typing updates its live preview without
          recreating TabUI. Track changes in TabUI also update the preview.
        </p>
        <form
          aria-label="Practice session"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim() === "") {
              setFormError("Enter a session title.");
              return;
            }
            const session: PracticeSession = {
              id: crypto.randomUUID(),
              title: title.trim(),
              pace,
              notes: includeNotes ? notes.trim() : "",
              track: activeTrack,
            };
            setSessions((v) => [...v, session]);
            setFormError("");
          }}
        >
          <label>
            Session title
            <input
              value={title}
              required
              aria-invalid={formError !== ""}
              aria-describedby={formError ? "session-title-error" : undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                setFormError("");
              }}
            />
          </label>
          {formError && (
            <p id="session-title-error" role="alert">
              {formError}
            </p>
          )}
          <label>
            Practice pace
            <select
              value={pace}
              onChange={(event) => setPace(event.target.value)}
            >
              <option>Slow</option>
              <option>Steady</option>
              <option>Fast</option>
            </select>
          </label>
          <label className="host-checkbox">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(event) => setIncludeNotes(event.target.checked)}
            />
            Include practice notes
          </label>
          {includeNotes && (
            <label>
              Practice notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          )}
          <p>
            Live preview:{" "}
            <output aria-label="Session preview">
              {title.trim() || "Untitled session"} · {pace} · {activeTrack}
            </output>
          </p>
          <button type="submit">Save session</button>
        </form>
        <ul aria-label="Saved sessions">
          {sessions.map((session) => (
            <li key={session.id}>
              <strong>{session.title}</strong> · {session.pace} ·{" "}
              {session.track}
              {session.notes && <p>{session.notes}</p>}
              <button
                type="button"
                aria-label={`Remove session ${session.title}`}
                onClick={() =>
                  setSessions((v) => v.filter((s) => s.id !== session.id))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
      <dl>
        <dt>Active track</dt>
        <dd>
          <output aria-label="Active track">{activeTrack}</output>
        </dd>
        <dt>Layout width</dt>
        <dd>
          <output aria-label="Layout width">{width}</output>
        </dd>
        <dt>Change events</dt>
        <dd>
          <output aria-label="Change events">{events}</output>
        </dd>
        <dt>Effect setups</dt>
        <dd>
          <output aria-label="Effect setups">{setups}</output>
        </dd>
        <dt>Effect cleanups</dt>
        <dd>
          <output aria-label="Effect cleanups">{cleanups}</output>
        </dd>
      </dl>
      <p id="host-sibling">React-owned content stays mounted.</p>
      {error && <p role="alert">{error}</p>}
      {mounted && (
        <TabUI
          score={score}
          variant={variant}
          onReady={onReady}
          onChange={onChange}
          onError={onError}
        />
      )}
    </main>
  );
}

const root = document.getElementById("root");
if (root === null) {
  throw new Error("Missing React application root");
}
createRoot(root).render(
  <StrictMode>
    <ReactDemo />
  </StrictMode>
);
