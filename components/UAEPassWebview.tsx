// UAEPassWebView.tsx
import { UAEPASSRouterLike } from "@/utils/uaepass";
import * as ExpoLinking from "expo-linking";
import React, { useCallback, useRef } from "react";
import { Linking } from "react-native";
import type { WebViewProps } from "react-native-webview";
import { WebView } from "react-native-webview";
import { ShouldStartLoadRequestEvent } from "react-native-webview/lib/RNCWebViewNativeComponent";
import {
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
} from "react-native-webview/lib/WebViewTypes";

interface Props extends WebViewProps {
  source: WebViewProps["source"];
  onUAEPassSuccess?: (code: string) => void;
  onUAEPassFailure?: (reason: string) => void; // e.g., "cancel", "Signing Failed"
  onSigningCompleted?: () => void;
  config: UAEPASSRouterLike;
  canOpenUAEPASS: boolean;
}

const getParam = (urlStr: string, key: string) => {
  try {
    const url = new URL(urlStr);
    return url.searchParams.get(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const contains = (s: string, sub: string) => s.indexOf(sub) !== -1;
const containsAny = (s: string, subs: string[]) =>
  subs.some((sub) => contains(s, sub));

const externalURLSchemeSuccess = () =>
  ExpoLinking.createURL("/uaepass/success");
const externalURLSchemeFail = () => ExpoLinking.createURL("/uaepass/fail");

export const UAEPassWebView: React.FC<Props> = ({
  source,
  onUAEPassSuccess,
  onUAEPassFailure,
  onSigningCompleted,
  config,
  canOpenUAEPASS,
  ...props
}) => {
  // Mirror Swift flags
  const alreadyCanceledRef = useRef(false);
  const skipDismissRef = useRef(false);

  const env = config.environmentConfig;
  const redirectUriLogin = config.spConfig.redirectUriLogin;

  const onShouldStart = useCallback(
    (req: ShouldStartLoadRequestEvent): boolean => {
      const urlString = req.mainDocumentURL ?? req.url;
      if (!urlString) return true;

      // Debug (like print in Swift)
      console.log("### URL ### :", urlString);

      if (containsAny(urlString, ["error=access_denied", "error=cancelled"])) {
        if (!alreadyCanceledRef.current) {
          skipDismissRef.current = true;
          alreadyCanceledRef.current = true;
          onUAEPassFailure?.("cancel");
        }
        return false;
      }

      if (
        contains(urlString, redirectUriLogin) &&
        contains(urlString, "code=")
      ) {
        const code = getParam(urlString, "code");
        console.log("### code Received:", urlString, code);
        if (code && code.length > 0) {
          skipDismissRef.current = true;
          onUAEPassSuccess?.(code);
        }
        return false;
      }

      if (contains(urlString, "uaepass://")) {
        const replaced = urlString.replace("uaepass://", env.uaePassSchemeURL);
        const successurl =
          getParam(urlString, "successurl") ?? externalURLSchemeSuccess();
        const failureurl =
          getParam(urlString, "failureurl") ?? externalURLSchemeFail();

        try {
          const u = new URL(replaced);
          u.searchParams.set("successurl", successurl);
          u.searchParams.set("failureurl", failureurl);
          u.searchParams.set("closeondone", "true");

          const finalUrl = u.toString();
          console.log("finalUrl", finalUrl);
          if (canOpenUAEPASS) {
            Linking.openURL(finalUrl);
          } else {
            const fallback = env.uaePassSchemeURL;
            if (canOpenUAEPASS) {
              Linking.openURL(fallback);
            }
          }
        } finally {
          return false;
        }
      }

      if (contains(urlString, "status=finished")) {
        onSigningCompleted?.();
        return false;
      }

      if (contains(urlString, "status=")) {
        if (contains(urlString, "status=success")) {
          return true;
        } else {
          onUAEPassFailure?.("Signing Failed");
          return false;
        }
      }

      if (
        req.navigationType === "click" &&
        (contains(urlString, "signup") ||
          contains(urlString, "account-recovery"))
      ) {
        try {
          if (canOpenUAEPASS) {
            Linking.openURL(urlString);
          }
        } catch {}
        return true;
      }

      return true;
    },
    [
      redirectUriLogin,
      onUAEPassFailure,
      onUAEPassSuccess,
      env.uaePassSchemeURL,
      canOpenUAEPASS,
      onSigningCompleted,
    ]
  );

  // Inside UAEPassWebView component:
  const handleWebError = React.useCallback(
    (e: WebViewErrorEvent) => {
      const code = Number(e.nativeEvent.code); // iOS mirrors NSURLError codes
      // console.log("WebView error:", code, e.nativeEvent.description);

      if (code === -1001 || code === -1003 || code === -1100) {
        if (code === -1001) {
          // TIMED OUT
          // console.log("CODE to handle TIMEOUT");
        } else if (code === -1003) {
          // SERVER CANNOT BE FOUND
          // console.log("CODE to handle SERVER not found");
        } else if (code === -1100) {
          // URL NOT FOUND ON SERVER (or file does not exist)
          // console.log("CODE to handle URL not found");
        }
        skipDismissRef.current = true;
        alreadyCanceledRef.current = true;
        onUAEPassFailure?.("cancel");
      }
    },
    [onUAEPassFailure]
  );

  // Optional: catch HTTP 4xx/5xx (useful for 404/500 that won't surface as -1100)
  const handleHttpError = React.useCallback(
    (e: WebViewHttpErrorEvent) => {
      const { statusCode, description, url } = e.nativeEvent;
      // console.log("HTTP error:", statusCode, description, url);
      if (statusCode >= 400) {
        skipDismissRef.current = true;
        alreadyCanceledRef.current = true;
        onUAEPassFailure?.("cancel");
      }
    },
    [onUAEPassFailure]
  );

  return (
    <WebView
      {...props}
      cacheEnabled={false}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      source={source}
      originWhitelist={["*"]}
      onShouldStartLoadWithRequest={onShouldStart}
      // Optional: keeps navigation state readable/loggable
      onNavigationStateChange={(nav) => {
        console.log("NAV:", nav.url);
      }}
      onError={handleWebError}
      onHttpError={handleHttpError}
    />
  );
};
