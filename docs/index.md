---
title: TabUI
sidebar: false
aside: false
outline: false
prev: false
next: false
---

<script setup>
import { withBase } from "vitepress";
</script>

# TabUI

A guitar tablature editor that runs in the browser. You can embed it in any web
app, with any framework or none.

[Try the demo](/demo) ·
[Embed it](/embedding) ·
[Shortcuts](/keyboard-shortcuts) ·
<a :href="withBase('/api/')" target="_self">API reference</a> ·
[GitHub](https://github.com/nik-idc/tabui)

![The TabUI editor with a four-track score](/screenshot.png)

## What it does

If you know Guitar Pro, you know most of TabUI. You select notes, type frets,
and set durations and techniques from the side panel or with shortcuts. It has
undo and redo, several tracks, up to four voices per staff, and playback with
synthesized tones or your own samples.

Two things I put extra work into:

- **Accessibility.** The keyboard and the mouse are meant to be equal, and
  screen readers announce what happens. I test it with NVDA and Orca.
- **Performance.** A 1000-bar score feels the same as a 10-bar one.

## Status

TabUI is a project I build in my free time. Version 0.5.0 is the first one I'd
call usable. It only does guitar tablature for now, and APIs can still change. See the
[roadmap](https://github.com/nik-idc/tabui/blob/master/ROADMAP.md) for what's
next.
