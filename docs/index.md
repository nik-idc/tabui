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

A guitar tablature editor that runs in the browser. It can be embedded in any
web app, with any framework or none.

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

I also focus on:

- **Accessibility.** The keyboard and the mouse are meant to be equal, and
  screen readers announce what happens. I test it with NVDA and Orca.
- **Performance.** A 1000-bar score feels the same as a 10-bar one.

## Why I built this

**I built this mainly for fun and for my own use.** I wanted an open source tab
editor that runs on any platform and works out of the box, with the flow of
Guitar Pro and similar tools. MuseScore already does most of what TabUI does,
but to me it feels like a tool for composers, and its flow is a little foreign
to me.

The core of TabUI is creating and editing tabs. I use it to write my own tabs,
not to open existing ones. That's why version 0.5.0 has only basic MusicXML
import and export, and no Guitar Pro support yet. It's also why TabUI shows
tabs only.

Please keep in mind that I have no formal music education and I can't read
standard notation. Someone who knows music theory may find things in the editor
or the code that look odd. If you do, I'd like to hear about it.

## Note

TabUI is a project I build in my free time. Version 0.5.0 is the first one I'd
call usable. It only does guitar tablature for now, and APIs can still change. See the
[roadmap](https://github.com/nik-idc/tabui/blob/master/ROADMAP.md) for what's
next.
