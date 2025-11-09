export interface ListenerConfig {
  element: HTMLElement;
  event: keyof GlobalEventHandlersEventMap;
  handler: (...args: any[]) => void;
}

export class ListenerManager {
  private listeners: ListenerConfig[] = [];

  addListener(config: ListenerConfig): void {
    // Store the handler and bind it
    this.listeners.push(config);
    config.element.addEventListener(config.event, config.handler);
  }

  bindAll(configs: ListenerConfig[]): void {
    configs.forEach((config) => this.addListener(config));
  }

  unbindAll(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}
