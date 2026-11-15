<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData, withBase } from "vitepress";

/** The element the demo renders into. */
const host = ref<HTMLElement>();
const { isDark } = useData();

/** Removes the demo. Set once the browser-only module has loaded. */
let unmount: (() => void) | undefined;
/** Whether the page left before the demo module finished loading. */
let isUnmounted = false;

onMounted(async () => {
  // TabUI needs the DOM, so load it only in the browser.
  const { mountDemo } = await import("../../../../demo/raw/demo-app");
  if (isUnmounted || host.value === undefined) {
    return;
  }

  const listeners = new Set<() => void>();
  const stopWatch = watch(isDark, () => {
    for (const listener of listeners) {
      listener();
    }
  });
  const unmountDemo = mountDemo(host.value, {
    assetBaseUrl: withBase("/"),
    appearance: {
      isDark: () => isDark.value,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  });
  unmount = () => {
    stopWatch();
    unmountDemo();
  };
});

onBeforeUnmount(() => {
  isUnmounted = true;
  unmount?.();
});
</script>

<template>
  <div ref="host" class="tabui-demo" />
</template>

<style>
.tabui-demo {
  --demo-text: var(--vp-c-text-1);
  --demo-muted: var(--vp-c-text-2);
  --demo-border: var(--vp-c-divider);
  --demo-surface: var(--vp-c-bg-soft);
  --demo-active: var(--vp-c-default-soft);
  --demo-editor-height: calc(100dvh - var(--vp-nav-height) - 32px);
}
</style>
