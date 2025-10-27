import { createDiv, createScript, createSVG } from "@/shared";
import {
  SideControlsTemplateBuilder,
  TopControlsTemplateBuilder,
  ModalsBuilder,
} from "../shared/misc/deprecated/template";

/**
 * Builds template for the editor: UI buttons and
 */
export class TemplateBuilder {
  private _rootDiv: HTMLDivElement;

  private _topControlsTemplateBuilder: TopControlsTemplateBuilder;
  private _sideControlsTemplateBuilder: SideControlsTemplateBuilder;
  private _modalsBuilder: ModalsBuilder;

  constructor(rootDiv: HTMLDivElement) {
    this._rootDiv = rootDiv;

    this._topControlsTemplateBuilder = new TopControlsTemplateBuilder(this._rootDiv);
    this._sideControlsTemplateBuilder = new SideControlsTemplateBuilder(this._rootDiv);
    this._modalsBuilder = new ModalsBuilder(this._rootDiv);
  }

  private buildRenderArea(): void {
    // Bend types list
    const mainEditorContainer = createDiv();
    mainEditorContainer.setAttribute("id", "mainEditorContainer");
    mainEditorContainer.setAttribute("class", "editorContainer");

    const credentialsContainer = createDiv();
    credentialsContainer.setAttribute("id", "credentialsContainer");
    mainEditorContainer.appendChild(credentialsContainer);

    const svgContainer = createDiv();
    svgContainer.setAttribute("id", "svgContainer");
    mainEditorContainer.appendChild(svgContainer);

    const svgRoot = createSVG();
    svgRoot.setAttribute("id", "svgRoot");
    svgRoot.setAttribute("class", "tabSVG");
    svgContainer.appendChild(svgRoot);

    this._rootDiv.appendChild(mainEditorContainer);
  }

  private attachScript(): void {
    const script = createScript();
    script.setAttribute("src", "main.ts");
    script.setAttribute("type", "module");
    script.defer = true;

    this._rootDiv.appendChild(script);
  }

  public build(): void {
    this._topControlsTemplateBuilder.build();
    this._sideControlsTemplateBuilder.build();

    this.buildRenderArea();
    // this.attachScript();

    this._modalsBuilder.build();
  }
}
