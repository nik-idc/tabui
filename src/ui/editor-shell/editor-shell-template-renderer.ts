import { ResolvedTabUIConfig } from "../../config/tabui-config";
import { TabUIEditorMode } from "../../config/tabui-config";
import { runCleanupSteps } from "../../shared/misc/run-cleanup-steps";
import { EditorShellTemplate } from "./editor-shell-template";
import { ResponsiveInteractionMode } from "./responsive-interaction-mode";

const SHELL_CLASSES = [
  "tu-score-panel-top",
  "tu-score-panel-bottom",
  "tu-side-controls-left",
  "tu-side-controls-right",
  "tu-score-panel-hidden",
  "tu-side-controls-hidden",
  "tu-side-controls-collapsed",
  "tu-responsive-view-only",
  "tu-responsive-blocked",
  "tu-view-only",
];

export class EditorShellTemplateRenderer {
  readonly rootDiv: HTMLDivElement;
  readonly config: ResolvedTabUIConfig;
  readonly template: EditorShellTemplate;

  private _assembled = false;
  private _boundActivateSkipLink: (event: MouseEvent) => void;

  constructor(
    rootDiv: HTMLDivElement,
    config: ResolvedTabUIConfig,
    template: EditorShellTemplate
  ) {
    this.rootDiv = rootDiv;
    this.config = config;
    this.template = template;
    this._boundActivateSkipLink = (event) => {
      event.preventDefault();
      this.template.notationViewport.focus({ preventScroll: true });
    };
  }

  private applyTheme(): void {
    for (const [name, value] of Object.entries(this.config.theme.cssVars)) {
      this.rootDiv.style.setProperty(name, value);
    }
  }

  private assemble(): void {
    const {
      announcementHost,
      skipLink,
      scorePanelHost,
      sidePanelHost,
      notationViewport,
      responsiveMessage,
      dialogHost,
    } = this.template;
    this.rootDiv.classList.add("tu-editor");
    this.rootDiv.classList.toggle(
      "tu-view-only",
      this.config.interaction.mode === TabUIEditorMode.ViewOnly
    );
    this.applyTheme();

    announcementHost.classList.add("tu-announcement-host");
    announcementHost.setAttribute("role", "status");
    announcementHost.ariaLive = "polite";
    announcementHost.ariaAtomic = "true";

    skipLink.classList.add("tu-skip-link", "tu-visually-hidden");
    skipLink.href = `#${notationViewport.id}`;
    skipLink.textContent = "Skip to notation";
    skipLink.addEventListener("click", this._boundActivateSkipLink);

    scorePanelHost.classList.add("tu-top-controls-host");
    scorePanelHost.hidden = !this.config.panels.score.visible;

    sidePanelHost.classList.add("tu-side-controls-host");
    sidePanelHost.hidden = !this.config.panels.side.visible;

    notationViewport.classList.add("tu-notation-viewport");
    notationViewport.tabIndex = 0;
    notationViewport.setAttribute("role", "application");
    notationViewport.setAttribute("aria-label", "Notation editor");

    responsiveMessage.classList.add("tu-responsive-message");
    responsiveMessage.hidden = true;

    dialogHost.classList.add("tu-dialog-host");

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

    this.rootDiv.appendChild(skipLink);
    this.rootDiv.appendChild(scorePanelHost);
    this.rootDiv.appendChild(sidePanelHost);
    this.rootDiv.appendChild(notationViewport);
    this.rootDiv.appendChild(responsiveMessage);
    this.rootDiv.appendChild(dialogHost);
    this.rootDiv.appendChild(announcementHost);
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

  public measureViewportWidth(): number | undefined {
    const viewport = this.template.notationViewport;
    if (viewport.clientWidth > 0) {
      return viewport.clientWidth;
    }

    const rectWidth = viewport.getBoundingClientRect?.().width ?? 0;
    return rectWidth > 0 ? rectWidth : undefined;
  }

  /**
   * Measures notation width with no side panel so the responsive policy remains
   * stable whether that policy currently shows or hides the panel.
   */
  public measureResponsiveViewportWidth(): number | undefined {
    const rootWidth = this.rootDiv.clientWidth;
    const width =
      rootWidth > 0
        ? rootWidth
        : (this.rootDiv.getBoundingClientRect?.().width ?? 0);
    if (width <= 0) {
      return undefined;
    }

    const style = getComputedStyle(this.rootDiv);
    const horizontalPadding =
      Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight);
    return width - horizontalPadding;
  }

  public setResponsiveMode(mode: ResponsiveInteractionMode): void {
    const isViewOnly = mode === ResponsiveInteractionMode.ViewOnly;
    const isBlocked = mode === ResponsiveInteractionMode.Blocked;
    this.rootDiv.classList.toggle("tu-responsive-view-only", isViewOnly);
    this.rootDiv.classList.toggle("tu-responsive-blocked", isBlocked);
    this.template.sidePanelHost.hidden = !this.config.panels.side.visible;
    this.template.responsiveMessage.hidden = !isBlocked;
  }

  public dispose(): void {
    runCleanupSteps(
      () =>
        this.template.skipLink.removeEventListener(
          "click",
          this._boundActivateSkipLink
        ),
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
