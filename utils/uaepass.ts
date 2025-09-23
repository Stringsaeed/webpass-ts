// uaepass-config.ts
// Combined TypeScript translation of Configuration+UAEPassSigning.swift & UAEPassConfigQA.swift

import { Linking } from "react-native";

/**
 * 1. UAE PASS Parameters
 */
export enum UAEPAssParams {
  responseType = "code",
  acrValuesAppToApp = "urn:digitalid:authentication:flow:mobileondevice",
  acrValuesWebView = "urn:safelayer:tws:policies:authentication:level:low",
}

/**
 * 2. UAE PASS Environments
 */
export enum UAEPASSEnvirnonment {
  production,
  staging,
  qa,
  dev,
}

/**
 * 3. Base URLs
 */
export enum BaseUrls {
  devTX = "https://dev-id.uaepass.ae/",
  devIDS = "https://dev-ids.uaepass.ae/",
  qaTX = "https://qa-id.uaepass.ae/",
  qaIDS = "https://qa-ids.uaepass.ae/",
  prodTX = "https://id.uaepass.ae/",
  prodIDS = "https://ids.uaepass.ae/",
  stgTX = "https://stg-id.uaepass.ae/",
  stgIDS = "https://stg-ids.uaepass.ae/",
}

/**
 * Helper to resolve enum values
 */
export const getBaseUrl = (key: BaseUrls): string => key;

/**
 * 4. UAE Pass Service Types
 */
export enum UAEPassServiceType {
  faceAuthLoginURL,
  loginURL,
  userProfileURL,
  token,
  tokenTX,
  uploadFile,
  downloadFile,
  deleteFile,
}

export function getRequestType(
  type: UAEPassServiceType
): "GET" | "POST" | "DELETE" | null {
  switch (type) {
    case UAEPassServiceType.token:
    case UAEPassServiceType.tokenTX:
    case UAEPassServiceType.uploadFile:
      return "POST";
    case UAEPassServiceType.userProfileURL:
    case UAEPassServiceType.downloadFile:
      return "GET";
    case UAEPassServiceType.deleteFile:
      return "DELETE";
    default:
      return null;
  }
}

export function getContentType(type: UAEPassServiceType): string | null {
  switch (type) {
    case UAEPassServiceType.token:
    case UAEPassServiceType.tokenTX:
    case UAEPassServiceType.userProfileURL:
      return "application/x-www-form-urlencoded";
    case UAEPassServiceType.uploadFile:
      return "multipart/form-data";
    default:
      return null;
  }
}

/**
 * 5. UAEPassConfig class (environment specific setup)
 */
export class UAEPassConfig {
  txBaseURL: string;
  authURL: string;
  tokenURL: string;
  txTokenURL: string;
  profileURL: string;
  clientID: string;
  env: UAEPASSEnvirnonment;
  uaePassSchemeURL: string;

  constructor(clientID: string, env: UAEPASSEnvirnonment) {
    this.clientID = clientID;
    this.env = env;

    switch (env) {
      case UAEPASSEnvirnonment.production:
        this.uaePassSchemeURL = "uaepass://";
        this.txBaseURL = getBaseUrl(BaseUrls.prodTX);
        this.authURL = `${getBaseUrl(BaseUrls.prodTX)}idshub/authorize`;
        this.tokenURL = `${getBaseUrl(BaseUrls.prodTX)}idshub/token`;
        this.txTokenURL = `${getBaseUrl(
          BaseUrls.prodTX
        )}trustedx-authserver/oauth/main-as/token`;
        this.profileURL = `${getBaseUrl(BaseUrls.prodTX)}idshub/userinfo`;
        break;

      case UAEPASSEnvirnonment.staging:
        this.uaePassSchemeURL = "uaepassstg://";
        this.txBaseURL = getBaseUrl(BaseUrls.stgTX);
        this.authURL = `${getBaseUrl(BaseUrls.stgTX)}idshub/authorize`;
        this.tokenURL = `${getBaseUrl(BaseUrls.stgTX)}idshub/token`;
        this.txTokenURL = `${getBaseUrl(
          BaseUrls.stgTX
        )}trustedx-authserver/oauth/main-as/token`;
        this.profileURL = `${getBaseUrl(BaseUrls.stgTX)}idshub/userinfo`;
        break;

      case UAEPASSEnvirnonment.qa:
        this.uaePassSchemeURL = "uaepassqa://";
        this.txBaseURL = getBaseUrl(BaseUrls.qaTX);
        this.authURL = `${getBaseUrl(BaseUrls.qaTX)}idshub/authorize`;
        this.tokenURL = `${getBaseUrl(BaseUrls.qaTX)}idshub/token`;
        this.txTokenURL = `${getBaseUrl(
          BaseUrls.qaTX
        )}trustedx-authserver/oauth/main-as/token`;
        this.profileURL = `${getBaseUrl(BaseUrls.qaTX)}idshub/userinfo`;
        break;

      case UAEPASSEnvirnonment.dev:
        this.uaePassSchemeURL = "uaepassdev://";
        this.txBaseURL = getBaseUrl(BaseUrls.devTX);
        this.authURL = `${getBaseUrl(BaseUrls.devTX)}idshub/authorize`;
        this.tokenURL = `${getBaseUrl(BaseUrls.devTX)}idshub/token`;
        this.txTokenURL = `${getBaseUrl(
          BaseUrls.devTX
        )}trustedx-authserver/oauth/main-as/token`;
        this.profileURL = `${getBaseUrl(BaseUrls.devTX)}idshub/userinfo`;
        break;
    }
  }
}

/**
 * 6. Router typings
 */
export interface SPConfig {
  redirectUriLogin: string;
  state: string;
  loginScope: string;
}

export interface UAEPASSRouterLike {
  environmentConfig: UAEPassConfig;
  spConfig: SPConfig;
  sdkLang: string;
}

const __UAEPassConfig = {
  env: "staging", // or production // default staging
  clientId: "sandbox_stage",
  redirectURL: "com.anonymous.webpassts://modal",
  successHost: "uaePassSuccess",
  failureHost: "uaePassFail",
  scheme: "com.anonymous.webpassts",
  scope: "urn:uae:digitalid:profile",
  locale: "en",
  useAndroidCustomWebView: false,
};

/**
 * Provide your own singleton like UAEPASSRouter.shared
 */
export const UAEPASSRouter: UAEPASSRouterLike = {
  environmentConfig: new UAEPassConfig(
    __UAEPassConfig.clientId,
    UAEPASSEnvirnonment.staging
  ),
  spConfig: {
    redirectUriLogin: __UAEPassConfig.redirectURL,
    state: "UzkLPOzcsHs4SL9cNZ7bFATd",
    loginScope: __UAEPassConfig.scope,
  },
  sdkLang: "en",
};

/**
 * 7. URL helper
 */
function withQuery(base: string, query: Record<string, string | undefined>) {
  const url = new URL(base);
  Object.entries(query).forEach(([k, v]) => {
    if (typeof v !== "undefined" && v !== null) url.searchParams.set(k, v);
  });
  return url.toString();
}

/**
 * 8. UAEPassConfiguration - builds URLs dynamically
 */
export class UAEPassConfiguration {
  static async getServiceUrlForType(
    serviceType: UAEPassServiceType
  ): Promise<string> {
    const { environmentConfig: env, spConfig: sp, sdkLang } = UAEPASSRouter;
    const txBaseURL = env.txBaseURL;
    const locale = sdkLang;

    switch (serviceType) {
      case UAEPassServiceType.loginURL: {
        const canOpenUAEPASS = await Linking.canOpenURL(env.uaePassSchemeURL);
        const acr_values = canOpenUAEPASS
          ? UAEPAssParams.acrValuesAppToApp
          : UAEPAssParams.acrValuesWebView;

        return withQuery(env.authURL, {
          redirect_uri: sp.redirectUriLogin,
          client_id: env.clientID,
          response_type: UAEPAssParams.responseType,
          state: sp.state,
          scope: sp.loginScope,
          acr_values,
          ui_locales: locale,
        });
      }

      case UAEPassServiceType.faceAuthLoginURL: {
        const loginUrl = await UAEPassConfiguration.getServiceUrlForType(
          UAEPassServiceType.loginURL
        );
        const u = new URL(loginUrl);
        u.searchParams.set("verificationType", "face");
        return u.toString();
      }

      case UAEPassServiceType.token:
        return withQuery(env.tokenURL, { ui_locales: locale });

      case UAEPassServiceType.tokenTX:
        return withQuery(env.txTokenURL, { ui_locales: locale });

      case UAEPassServiceType.userProfileURL:
        return withQuery(env.profileURL, { ui_locales: locale });

      case UAEPassServiceType.uploadFile:
      case UAEPassServiceType.deleteFile:
        return withQuery(
          `${txBaseURL}trustedx-resources/esignsp/v2/signer_processes`,
          { ui_locales: locale }
        );

      case UAEPassServiceType.downloadFile:
        return withQuery(
          `${txBaseURL}trustedx-resources/esignsp/v2/documents/`,
          { ui_locales: locale }
        );

      default:
        return "";
    }
  }
}
