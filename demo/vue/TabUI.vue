<script setup lang="ts">
import { markRaw, onBeforeUnmount, onMounted, shallowRef } from "vue";
import {
  Score,
  TabUIEditor,
  TabUIEditorMode,
  TabUILayoutMode,
} from "@atikincode/tabui";
import type { TabUIEditorStateSnapshot } from "@atikincode/tabui";
import { themes } from "./themes";

const props = defineProps<{ score: Score; variant: "light" | "dark" }>();
const emit = defineEmits<{
  ready: [editor: TabUIEditor | null];
  change: [state: TabUIEditorStateSnapshot];
  error: [message: string];
}>();
const host = shallowRef<HTMLDivElement | null>(null);
let editor: TabUIEditor | null = null;
let unsubscribe: (() => void) | undefined;

// Vue owns the empty host. TabUI owns its children until this component unmounts.
onMounted(() => {
  if (host.value === null) throw new Error("Missing Vue editor host");
  editor = markRaw(
    new TabUIEditor(host.value, props.score, {
      assets: { variant: props.variant },
      theme: themes[props.variant],
      interaction: { mode: TabUIEditorMode.Edit },
      layout: { mode: TabUILayoutMode.SingleLine, width: 1200 },
    })
  );
  editor.init();
  unsubscribe = editor.subscribe((event) => {
    if (event.type === "change") emit("change", event.state);
    else emit("error", event.error.message);
  });
  emit("ready", editor);
});

onBeforeUnmount(() => {
  unsubscribe?.();
  editor?.dispose();
  editor = null;
  emit("ready", null);
});
</script>

<template>
  <div id="tabui-editor" ref="host" />
</template>
