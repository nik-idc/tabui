type ListenerEventMap = GlobalEventHandlersEventMap;

type ListenerConfigFor<K extends keyof ListenerEventMap> = {
  element: HTMLElement;
  event: K;
  handler: (event: ListenerEventMap[K]) => void;
};

export type ListenerConfig = {
  [K in keyof ListenerEventMap]: ListenerConfigFor<K>;
}[keyof ListenerEventMap];

type ListenerCleanup = () => void;

export class ListenerManager {
  private listeners: ListenerCleanup[] = [];

  /** Registers a typed DOM listener and tracks it for a matching removal. */
  addListener(config: ListenerConfig): void {
    const handler = config.handler as EventListener;
    config.element.addEventListener(config.event, handler);
    this.listeners.push(() =>
      config.element.removeEventListener(config.event, handler)
    );
  }

  bindAll(configs: ListenerConfig[]): void {
    this.unbindAll();
    configs.forEach((config) => this.addListener(config));
  }

  unbindAll(): void {
    this.listeners.forEach((cleanup) => cleanup());
    this.listeners = [];
  }
}
