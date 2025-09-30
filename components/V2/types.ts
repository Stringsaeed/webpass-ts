export type UAEPassEnv = "staging" | "production";

export interface UAEPassConfig {
  env?: UAEPassEnv; // default: 'staging'
  clientId: string; // from UAE PASS team
  redirectUri: string; // https://your.domain/callback
  appScheme: string; // e.g. 'yourapp' (registered deep link)
  scope?: string; // default: 'urn:uae:digitalid:profile:general'
  acrValues?: string; // default: 'urn:safelayer:tws:policies:authentication:level:low'
  uiLocales?: "en" | "ar"; // default: 'en'
  state?: string; // optional (CSRF)
  extraAuthParams?: Record<string, string | number | boolean | undefined>; // optional
}

export interface UAEPassResult {
  code: string;
  state?: string;
}

export interface UAEPassError {
  error: string;
  error_description?: string;
  state?: string;
}
