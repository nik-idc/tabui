import { ResolvedTabUIConfig } from "./tabui-config";

export type ResolvedAssetConfig = ResolvedTabUIConfig["assets"];

export function normalizeAssetBaseUrl(baseUrl: string): string {
  if (baseUrl === "") {
    return "";
  }

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

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
    return normalizedAssetPath;
  }

  return `${normalizedBaseUrl}/${normalizedAssetPath}`;
}
