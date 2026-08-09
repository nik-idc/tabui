import { ResolvedTabUIConfig } from "../../config/tabui-config";
import { runCleanupSteps } from "../../shared/misc/run-cleanup-steps";
import { EditorShellTemplate } from "./editor-shell-template";

const SHELL_CLASSES = [
  "tu-score-panel-top",
  "tu-score-panel-bottom",
  "tu-side-controls-left",
  "tu-side-controls-right",
  "tu-score-panel-hidden",
  "tu-side-controls-hidden",
  "tu-side-controls-collapsed",
];

export class EditorShellTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly config: ResolvedTabUIConfig;
  readonly template: EditorShellTemplate;

  private _assembled = false;

  constructor(
    rootDiv: HTMLDivElement,
    config: ResolvedTabUIConfig,
    template: EditorShellTemplate
  ) {
    this.rootDiv = rootDiv;
    this.config = config;
    this.template = template;
  }

  private applyTheme(): void {
    for (const [name, value] of Object.entries(this.config.theme.cssVars)) {
      this.rootDiv.style.setProperty(name, value);
    }
  }

  private assemble(): void {
    const { scorePanelHost, sidePanelHost, notationViewport } = this.template;
    this.rootDiv.classList.add("tu-editor");
    this.applyTheme();

    scorePanelHost.classList.add("tu-top-controls-host");
    sidePanelHost.classList.add("tu-side-controls-host");
    notationViewport.classList.add("tu-notation-viewport");
    scorePanelHost.hidden = !this.config.panels.score.visible;
    sidePanelHost.hidden = !this.config.panels.side.visible;

    const shellClasses = [
      `tu-score-panel-${this.config.panels.score.placement}`,
      `tu-side-controls-${this.config.panels.side.placement}`,
    ];
    if (!this.config.panels.score.visible) {
      shellClasses.push("tu-score-panel-hidden");
    }
    if (!this.config.panels.side.visible) {
      shellClasses.push("tu-side-controls-hidden");
    }
    this.rootDiv.classList.add(...shellClasses);

    this.rootDiv.appendChild(scorePanelHost);
    this.rootDiv.appendChild(sidePanelHost);
    this.rootDiv.appendChild(notationViewport);
    this._assembled = true;
  }

  public render(collapsed: boolean): void {
    if (!this._assembled) {
      this.assemble();
    }

    if (collapsed) {
      this.rootDiv.classList.add("tu-side-controls-collapsed");
    } else {
      this.rootDiv.classList.remove("tu-side-controls-collapsed");
    }
  }

  public measureAvailableWidth(): number | undefined {
    const viewport = this.template.notationViewport;
    const clientWidth = viewport.clientWidth;
    if (clientWidth > 0) {
      return clientWidth - this.config.layout.horizontalPadding * 2;
    }

    const rectWidth = viewport.getBoundingClientRect?.().width ?? 0;
    return rectWidth > 0
      ? rectWidth - this.config.layout.horizontalPadding * 2
      : undefined;
  }

  public dispose(): void {
    runCleanupSteps(
      () => this.rootDiv.replaceChildren(),
      () => {
        this.rootDiv.classList.remove("tu-editor");
        this.rootDiv.classList.remove(...SHELL_CLASSES);
      },
      () => {
        for (const cssVar of Object.keys(this.config.theme.cssVars)) {
          this.rootDiv.style.removeProperty(cssVar);
        }
      },
      () => {
        this._assembled = false;
      }
    );
  }
}
