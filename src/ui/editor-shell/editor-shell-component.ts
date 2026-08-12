import { ResolvedTabUIConfig } from "../../config/tabui-config";
import { EditorShellTemplate } from "./editor-shell-template";
import { EditorShellTemplateRenderer } from "./editor-shell-template-renderer";
import { ResponsiveInteractionMode } from "./responsive-interaction-mode";

export class EditorShellComponent {
  readonly rootDiv: HTMLDivElement;
  readonly config: ResolvedTabUIConfig;
  readonly template: EditorShellTemplate;
  readonly templateRenderer: EditorShellTemplateRenderer;

  private _sidePanelCollapsed: boolean;

  constructor(rootDiv: HTMLDivElement, config: ResolvedTabUIConfig) {
    this.rootDiv = rootDiv;
    this.config = config;
    this.template = new EditorShellTemplate();
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
    this.templateRenderer.dispose();
  }
}
