import type { UAEPassConfig, UAEPassEnv } from "./types";

const ENDPOINTS = {
  staging: {
    authorize: "https://stg-id.uaepass.ae/idshub/authorize",
  },
  production: {
    authorize: "https://id.uaepass.ae/idshub/authorize",
  },
} as const;

export const buildAuthUrl = (cfg: UAEPassConfig) => {
  const env = cfg.env ?? "staging";
  const scope = cfg.scope ?? "urn:uae:digitalid:profile:general";
  const acr =
    cfg.acrValues ?? "urn:safelayer:tws:policies:authentication:level:low";
  const ui = cfg.uiLocales ?? "en";
  const searchParams = new URLSearchParams({
    redirect_uri: cfg.redirectUri,
    client_id: String(cfg.clientId),
    response_type: "code",
    scope,
    acr_values: acr,
    ui_locales: ui,
  });
  if (cfg.state) searchParams.set("state", cfg.state);
  if (cfg.extraAuthParams) {
    for (const [k, v] of Object.entries(cfg.extraAuthParams)) {
      if (v !== undefined) searchParams.set(k, String(v));
    }
  }
  return `${ENDPOINTS[env].authorize}?${searchParams.toString()}`;
};

export const parseUrlParams = (url: string): Record<string, string> => {
  const u = new URL(url);
  const out: Record<string, string> = {};
  u.searchParams.forEach((v, k) => {
    out[k] = v;
  });
  return out;
};

export const withQuery = (base: string, params: Record<string, string>) => {
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
};

export const isUAEPassAppScheme = (url: string) => url.startsWith("uaepass://");

export const isOurResumeRoute = (url: string, scheme: string) =>
  url.startsWith(`${scheme}:///resume_authn`) ||
  url.startsWith(`${scheme}://resume_authn`);

export const extractOriginalCallbackFromResume = (url: string) => {
  const u = new URL(url);
  const original = u.searchParams.get("url");
  if (!original) throw new Error("Missing 'url' param in resume_authn link");
  return original;
};

export const isFinalRedirect = (navigatedUrl: string, redirectUri: string) =>
  navigatedUrl.startsWith(redirectUri);

export const parseAuthResult = (url: string) => {
  const { code, state, error, error_description } = parseUrlParams(url);
  return { code, state, error, error_description };
};

export const updateURLBasedScheme = (url: string, env: UAEPassEnv) => {
  return url.replace(
    "uaepass://",
    env === "staging" ? "uaepassstg://" : "uaepass://"
  );
};
