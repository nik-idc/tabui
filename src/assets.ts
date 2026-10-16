import { normalizeAssetBaseUrl } from "./config/tabui-config";
import type { ResolvedTabUIConfig } from "./config/tabui-config";

const icons = import.meta.glob<string>("../assets/{img,img-dark}/**/*.svg", {
  eager: true,
  query: "?inline",
  import: "default",
});

export type ResolvedAssetConfig = ResolvedTabUIConfig["assets"];

function normalizeAssetPath(
  assetConfig: ResolvedAssetConfig,
  assetPath: string
) {
  const normalizedAssetPath = assetPath.replace(/^\/+/, "");
  if (assetConfig.variant === "dark") {
    return `img-dark/${normalizedAssetPath.replace(/^img\//, "")}`;
  }

  return normalizedAssetPath;
}

/** Resolves a bundled icon by default, or joins a custom public asset URL. */
export function resolveAssetUrl(
  assetConfig: ResolvedAssetConfig | string,
  assetPath: string
): string {
  const normalizedAssetConfig =
    typeof assetConfig === "string"
      ? { baseUrl: assetConfig, variant: "light" as const }
      : assetConfig;
  const normalizedBaseUrl = normalizeAssetBaseUrl(
    normalizedAssetConfig.baseUrl.trim()
  );
  const normalizedAssetPath = normalizeAssetPath(
    normalizedAssetConfig,
    assetPath
  );

  if (normalizedBaseUrl === "") {
    const bundledUrl = icons[`../assets/${normalizedAssetPath}`];
    if (bundledUrl === undefined) {
      throw new Error(`Unknown bundled icon: ${normalizedAssetPath}`);
    }
    return bundledUrl;
  }

  const separator = normalizedBaseUrl.endsWith("/") ? "" : "/";
  return `${normalizedBaseUrl}${separator}${normalizedAssetPath}`;
}
