export interface ElementRenderer {
  render(...params: any): ElementRenderer[] | void;

  unrender(): void;
}
