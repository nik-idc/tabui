import {
  ChangeDetectorRef,
  Component,
  inject,
  provideZoneChangeDetection,
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { Score } from "@atikincode/tabui";
import type { TabUIEditor, TabUIEditorStateSnapshot } from "@atikincode/tabui";
import { TabUIHost } from "./tabui";

type PracticeSession = {
  id: string;
  title: string;
  pace: string;
  notes: string;
  track: string;
};

/** Creates the small score shared by every editor lifetime in this host. */
function createScore(): Score {
  const score = new Score();
  score.addTrack(score.tracks[0].context.instrument, "Second track");
  return score;
}

/** A standalone Angular host with ordinary template-driven practice forms. */
@Component({
  selector: "angular-demo",
  standalone: true,
  imports: [FormsModule, TabUIHost],
  templateUrl: "./app.html",
})
export class AngularDemo {
  private readonly _changeDetector = inject(ChangeDetectorRef);
  readonly score = createScore();
  mounted = true;
  variant: "light" | "dark" = "light";
  editor: TabUIEditor | null = null;
  activeTrack = "Unmounted";
  width = 1200;
  events = 0;
  setups = 0;
  cleanups = 0;
  title = "";
  pace = "Steady";
  includeNotes = true;
  notes = "";
  sessions: PracticeSession[] = [];
  formError = "";
  error = "";

  onReady(editor: TabUIEditor | null): void {
    // Child lifecycle hooks can run after this host's bindings were checked.
    queueMicrotask(() => {
      this.editor = editor;
      if (editor) {
        this.setups++;
        this.activeTrack = editor.getState().activeTrack.name;
        this.width = editor.getState().layout.width;
      } else {
        this.cleanups++;
        this.activeTrack = "Unmounted";
      }
      this._changeDetector.markForCheck();
    });
  }

  onChange(state: TabUIEditorStateSnapshot): void {
    this.activeTrack = state.activeTrack.name;
    this.width = state.layout.width;
    this.events++;
  }

  saveSession(): void {
    if (!this.title.trim()) {
      this.formError = "Enter a session title.";
      return;
    }
    this.sessions = [
      ...this.sessions,
      {
        id: crypto.randomUUID(),
        title: this.title.trim(),
        pace: this.pace,
        notes: this.includeNotes ? this.notes.trim() : "",
        track: this.activeTrack,
      },
    ];
    this.formError = "";
  }

  removeSession(id: string): void {
    this.sessions = this.sessions.filter((s) => s.id !== id);
  }
}

void bootstrapApplication(AngularDemo, {
  providers: [provideZoneChangeDetection()],
});
