import { ResolvedTabUIConfig } from "../../config/tabui-config";
import { DialogEnforcer } from "../../shared/hmtl/dialog-enforcer";
import { EditorShellTemplate } from "./editor-shell-template";
import { EditorShellTemplateRenderer } from "./editor-shell-template-renderer";
import { ResponsiveInteractionMode } from "./responsive-interaction-mode";

export class EditorShellComponent {
  readonly rootDiv: HTMLDivElement;
  readonly config: ResolvedTabUIConfig;
  readonly template: EditorShellTemplate;
  readonly templateRenderer: EditorShellTemplateRenderer;
  readonly dialogEnforcer: DialogEnforcer;

  private _sidePanelCollapsed: boolean;
  private _announcementTimer?: ReturnType<typeof setTimeout>;
  private _disposed = false;

  constructor(rootDiv: HTMLDivElement, config: ResolvedTabUIConfig) {
    this.rootDiv = rootDiv;
    this.config = config;
    this.template = new EditorShellTemplate();
    this.dialogEnforcer = new DialogEnforcer(
      this.template.dialogHost,
      this.mountAnnouncer.bind(this)
    );
    this.templateRenderer = new EditorShellTemplateRenderer(
      rootDiv,
      config,
      this.template
    );
    this._sidePanelCollapsed =
      config.panels.side.visible &&
      config.panels.side.collapsible &&
      config.panels.side.initiallyCollapsed;
  }

  public render(): void {
    this.templateRenderer.render(this._sidePanelCollapsed);
  }

  /** Moves the same region, clearing pending text only when its parent changes. */
  public mountAnnouncer(container: HTMLElement): void {
    const region = this.template.announcementHost;
    if (this._disposed || region.parentElement === container) {
      return;
    }

    this.announce("");
    container.appendChild(region);
  }

  /** Announces text; repeats clear briefly so they produce a fresh update. */
  public announce(text: string): void {
    if (this._disposed) {
      return;
    }

    clearTimeout(this._announcementTimer);
    this._announcementTimer = undefined;
    const region = this.template.announcementHost;

    if (text === "" || region.textContent !== text) {
      region.textContent = text;
      return;
    }

    // 1. Resetting ARIA state to trigger a change
    // 2. Using a timer to ensure sync textContent change isn't collapsed
    //    into one action
    region.textContent = "";
    this._announcementTimer = setTimeout(() => {
      region.textContent = text;
      this._announcementTimer = undefined;
    }, 50);
  }

  public setSidePanelCollapsed(collapsed: boolean): void {
    this._sidePanelCollapsed = collapsed;
    this.render();
  }

  public toggleSidePanel(): boolean {
    this.setSidePanelCollapsed(!this._sidePanelCollapsed);
    return this._sidePanelCollapsed;
  }

  public measureAvailableWidth(): number | undefined {
    return this.templateRenderer.measureAvailableWidth();
  }

  public measureViewportWidth(): number | undefined {
    return this.templateRenderer.measureViewportWidth();
  }

  public measureResponsiveViewportWidth(): number | undefined {
    return this.templateRenderer.measureResponsiveViewportWidth();
  }

  public setResponsiveMode(mode: ResponsiveInteractionMode): void {
    this.templateRenderer.setResponsiveMode(mode);
  }

  public get sidePanelCollapsed(): boolean {
    return this._sidePanelCollapsed;
  }

  public dispose(): void {
    this.announce("");
    this._disposed = true;
    this.templateRenderer.dispose();
  }
}
