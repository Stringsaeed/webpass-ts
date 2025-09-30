export interface SPConfig {
  redirectUriLogin: string;
  state: string;
  loginScope: string;
}

export interface UAEPASSRouterLike {
  environmentConfig: ReturnType<typeof getUAEPassConfig>;
  spConfig: SPConfig;
  sdkLang: string;
}

export const enum UAEPassEnvironment {
  production,
  staging,
}

export const enum UAEPassParams {
  responseType = "code",
  acrValuesAppToApp = "urn:digitalid:authentication:flow:mobileondevice",
  acrValuesWebView = "urn:safelayer:tws:policies:authentication:level:low",
}

export const enum BaseUrls {
  prodTX = "https://id.uaepass.ae/",
  prodIDS = "https://ids.uaepass.ae/",
  stgTX = "https://stg-id.uaepass.ae/",
  stgIDS = "https://stg-ids.uaepass.ae/",
}

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

export const getUAEPassConfig = ({
  clientID,
  env,
}: {
  clientID: string;
  env: UAEPassEnvironment;
}) => {
  switch (env) {
    case UAEPassEnvironment.production:
      return {
        env,
        clientID,
        uaePassSchemeURL: "uaepass://",
        txBaseURL: BaseUrls.prodTX,
        authURL: `${BaseUrls.prodTX}idshub/authorize`,
        tokenURL: `${BaseUrls.prodTX}idshub/token`,
        txTokenURL: `${BaseUrls.prodTX}trustedx-authserver/oauth/main-as/token`,
        profileURL: `${BaseUrls.prodTX}idshub/userinfo`,
      };

    case UAEPassEnvironment.staging:
      return {
        env,
        clientID,
        uaePassSchemeURL: "uaepassstg://",
        txBaseURL: BaseUrls.stgTX,
        authURL: `${BaseUrls.stgTX}idshub/authorize`,
        tokenURL: `${BaseUrls.stgTX}idshub/token`,
        txTokenURL: `${BaseUrls.stgTX}trustedx-authserver/oauth/main-as/token`,
        profileURL: `${BaseUrls.stgTX}idshub/userinfo`,
      };
  }
};

function withQuery(base: string, query: Record<string, string | undefined>) {
  let newURL = `${base}?`;
  newURL += Object.entries(query)
    .map(([k, v]) => {
      if (typeof v !== "undefined" && v !== null) {
        return `${k}=${v}`;
      }
    })
    .filter(Boolean)
    .join("&");
  return newURL;
}

export const getUAEPassConfiguration = (
  serviceType: UAEPassServiceType,
  config: UAEPASSRouterLike,
  canOpenUAEPASS: boolean
): string => {
  const { environmentConfig: env, spConfig: sp, sdkLang } = config;
  const txBaseURL = env.txBaseURL;
  const locale = sdkLang;

  switch (serviceType) {
    case UAEPassServiceType.loginURL: {
      const acr_values = canOpenUAEPASS
        ? UAEPassParams.acrValuesAppToApp
        : UAEPassParams.acrValuesWebView;

      return withQuery(env.authURL, {
        redirect_uri: sp.redirectUriLogin,
        client_id: env.clientID,
        response_type: UAEPassParams.responseType,
        state: sp.state,
        scope: sp.loginScope,
        acr_values,
        ui_locales: locale,
      });
    }

    case UAEPassServiceType.faceAuthLoginURL: {
      const loginUrl = getUAEPassConfiguration(
        UAEPassServiceType.loginURL,
        config,
        canOpenUAEPASS
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
      return withQuery(`${txBaseURL}trustedx-resources/esignsp/v2/documents/`, {
        ui_locales: locale,
      });

    default:
      return "";
  }
};
