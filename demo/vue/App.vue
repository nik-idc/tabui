<script setup lang="ts">
import { markRaw, ref, shallowRef } from "vue";
import { Score } from "@atikincode/tabui";
import type { TabUIEditor, TabUIEditorStateSnapshot } from "@atikincode/tabui";
import TabUI from "./TabUI.vue";

type PracticeSession = {
  id: string;
  title: string;
  pace: string;
  notes: string;
  track: string;
};

// Library class graphs must not become deep Vue proxies. The score survives remounts.
const score = shallowRef(markRaw(new Score()));
score.value.addTrack(score.value.tracks[0].context.instrument, "Second track");
const editor = shallowRef<TabUIEditor | null>(null);
const mounted = ref(true);
const variant = ref<"light" | "dark">("light");
const activeTrack = ref("Unmounted");
const width = ref(1200);
const events = ref(0);
const setups = ref(0);
const cleanups = ref(0);
const title = ref("");
const pace = ref("Steady");
const includeNotes = ref(true);
const notes = ref("");
const sessions = ref<PracticeSession[]>([]);
const formError = ref("");
const error = ref("");

/** Publishes the current editor without making its internal objects reactive. */
function onReady(value: TabUIEditor | null) {
  editor.value = value === null ? null : markRaw(value);
  if (value === null) {
    cleanups.value++;
    activeTrack.value = "Unmounted";
  } else {
    setups.value++;
    activeTrack.value = value.getState().activeTrack.name;
    width.value = value.getState().layout.width;
  }
}

/** Copies public editor state into independent Vue host state. */
function onChange(state: TabUIEditorStateSnapshot) {
  activeTrack.value = state.activeTrack.name;
  width.value = state.layout.width;
  events.value++;
}

/** Validates and saves a snapshot of the host form and current editor track. */
function saveSession() {
  if (title.value.trim() === "") {
    formError.value = "Enter a session title.";
    return;
  }
  sessions.value.push({
    id: crypto.randomUUID(),
    title: title.value.trim(),
    pace: pace.value,
    notes: includeNotes.value ? notes.value.trim() : "",
    track: activeTrack.value,
  });
  formError.value = "";
}
</script>

<template>
  <main class="vue-demo" :data-theme="variant">
    <h1>TabUI + Vue</h1>
    <p>
      Select a track, resize, or remount the editor. Vue owns the practice form.
    </p>
    <nav aria-label="Vue host controls">
      <button @click="mounted = !mounted">
        {{ mounted ? "Unmount editor" : "Mount editor" }}
      </button>
      <button
        :disabled="editor === null"
        @click="editor?.refreshLayout(width === 1200 ? 1100 : 1200)"
      >
        Resize editor
      </button>
      <button @click="variant = variant === 'light' ? 'dark' : 'light'">
        Use {{ variant === "light" ? "dark" : "light" }} theme
      </button>
    </nav>
    <section class="host-session" aria-label="Vue practice planner">
      <h2>Vue practice planner</h2>
      <p>
        Typing updates this live preview without recreating TabUI. Track changes
        in TabUI also update the preview.
      </p>
      <form
        aria-label="Practice session"
        novalidate
        @submit.prevent="saveSession"
      >
        <label>
          Session title
          <input
            v-model="title"
            required
            :aria-invalid="formError !== ''"
            :aria-describedby="formError ? 'session-title-error' : undefined"
            @input="formError = ''"
          />
        </label>
        <p v-if="formError" id="session-title-error" role="alert">
          {{ formError }}
        </p>
        <label>
          Practice pace
          <select v-model="pace">
            <option>Slow</option>
            <option>Steady</option>
            <option>Fast</option>
          </select>
        </label>
        <label class="host-checkbox">
          <input v-model="includeNotes" type="checkbox" />
          Include practice notes
        </label>
        <label v-if="includeNotes">
          Practice notes
          <textarea v-model="notes" />
        </label>
        <p>
          Live preview:
          <output aria-label="Session preview">
            {{ title.trim() || "Untitled session" }} · {{ pace }} ·
            {{ activeTrack }}
          </output>
        </p>
        <button type="submit">Save session</button>
      </form>
      <ul aria-label="Saved sessions">
        <li v-for="session in sessions" :key="session.id">
          <strong>{{ session.title }}</strong> · {{ session.pace }} ·
          {{ session.track }}
          <p v-if="session.notes">{{ session.notes }}</p>
          <button
            type="button"
            :aria-label="`Remove session ${session.title}`"
            @click="sessions = sessions.filter((s) => s.id !== session.id)"
          >
            Remove
          </button>
        </li>
      </ul>
    </section>
    <dl>
      <dt>Active track</dt>
      <dd>
        <output aria-label="Active track">{{ activeTrack }}</output>
      </dd>
      <dt>Layout width</dt>
      <dd>
        <output aria-label="Layout width">{{ width }}</output>
      </dd>
      <dt>Change events</dt>
      <dd>
        <output aria-label="Change events">{{ events }}</output>
      </dd>
      <dt>Lifecycle setups</dt>
      <dd>
        <output aria-label="Lifecycle setups">{{ setups }}</output>
      </dd>
      <dt>Lifecycle cleanups</dt>
      <dd>
        <output aria-label="Lifecycle cleanups">{{ cleanups }}</output>
      </dd>
    </dl>
    <p id="host-sibling">Vue-owned content stays mounted.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <!-- A theme key creates a fresh editor with the same raw Score. -->
    <TabUI
      v-if="mounted"
      :key="variant"
      :score="score"
      :variant="variant"
      @ready="onReady"
      @change="onChange"
      @error="error = $event"
    />
  </main>
</template>
