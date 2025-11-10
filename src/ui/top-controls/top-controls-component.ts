import { NotationComponent } from "@/notation/notation-component";
import { template } from "@babel/core";
import { TrackControlsComponent } from "./score-controls/track-controls";

import { TopControlsTemplate } from "./top-controls-template";
import { TopControlsTemplateRenderer } from "./top-controls-template-renderer";
import { ScoreControlsComponent } from "./score-controls/score-controls-component";
import { PlayControlsComponent } from "./play-controls";

export class TopControlsComponent {
  readonly parentDiv: HTMLDivElement;
  readonly notationComponent: NotationComponent;

  readonly template: TopControlsTemplate;
  readonly templateRenderer: TopControlsTemplateRenderer;

  readonly scoreComponent: ScoreControlsComponent;
  readonly playComponent: PlayControlsComponent;

  constructor(parentDiv: HTMLDivElement, notationComponent: NotationComponent) {
    this.parentDiv = parentDiv;
    this.notationComponent = notationComponent;

    this.template = new TopControlsTemplate();
    this.scoreComponent = new ScoreControlsComponent(
      this.template.container,
      this.notationComponent
    );
    this.playComponent = new PlayControlsComponent(
      this.template.container,
      this.notationComponent
    );
    this.templateRenderer = new TopControlsTemplateRenderer(
      this.parentDiv,
      this.notationComponent,
      this.template
    );
  }

  public render(): void {
    this.templateRenderer.render();
    this.scoreComponent.render();
    this.playComponent.render();
  }
}
