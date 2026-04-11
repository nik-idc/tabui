import { ResolvedTabUIConfig } from "./tabui-config";

export function applyEditorTheme(
  rootDiv: HTMLDivElement,
  config: ResolvedTabUIConfig
): void {
  for (const [cssVarName, cssVarValue] of Object.entries(
    config.theme.cssVars
  )) {
    rootDiv.style.setProperty(cssVarName, cssVarValue);
    document.documentElement.style.setProperty(cssVarName, cssVarValue);
  }
}
