// UAEPassWebView.tsx
import { UAEPASSRouter } from "@/utils/uaepass"; // from your previous TS translation
import * as ExpoLinking from "expo-linking";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import type { WebViewProps } from "react-native-webview";
import { WebView } from "react-native-webview";
import { ShouldStartLoadRequestEvent } from "react-native-webview/lib/RNCWebViewNativeComponent";

interface Props extends WebViewProps {
  source: WebViewProps["source"];
  onUAEPassSuccess?: (code: string) => void;
  onUAEPassFailure?: (reason: string) => void; // e.g., "cancel", "Signing Failed"
  onSigningCompleted?: () => void;
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

/**
 * You can customize these app URL schemes to your app.
 * Make sure they're registered in your app's deep link config (iOS/Android).
 */
const externalURLSchemeSuccess = () =>
  ExpoLinking.createURL("/uaepass/success");
const externalURLSchemeFail = () =>
  ExpoLinking.createURL("/uaepass/fail");

export const UAEPassWebView: React.FC<Props> = ({
  source,
  onUAEPassSuccess,
  onUAEPassFailure,
  onSigningCompleted,
  ...props
}) => {
  // Mirror Swift flags
  const alreadyCanceledRef = useRef(false);
  const skipDismissRef = useRef(false);

  const env = UAEPASSRouter.environmentConfig;
  const redirectUriLogin = UAEPASSRouter.spConfig.redirectUriLogin;
  const [canOpenUAEPASS, setCanOpenUAEPASS] = useState(false);

  useEffect(() => {
    Linking.canOpenURL(env.uaePassSchemeURL).then((canOpen) => {
      setCanOpenUAEPASS(canOpen);
    });
  }, []);

  useEffect(() => {}, []);

  const onShouldStart = useCallback(
    (req: ShouldStartLoadRequestEvent): boolean => {
      const urlString = req.mainDocumentURL ?? req.url;
      if (!urlString) return true;

      // Debug (like print in Swift)
      // console.log("### URL ### :", urlString);

      // 1) Cancel / Access denied
      if (containsAny(urlString, ["error=access_denied", "error=cancelled"])) {
        if (!alreadyCanceledRef.current) {
          skipDismissRef.current = true;
          alreadyCanceledRef.current = true;
          onUAEPassFailure?.("cancel");
        }
        return false; // decisionHandler(.cancel)
      }

      // 2) Redirect back with code
      if (
        contains(urlString, redirectUriLogin) &&
        contains(urlString, "code=")
      ) {
        const code = getParam(urlString, "code");
        // console.log("### code Received:", urlString, code);
        if (code && code.length > 0) {
          skipDismissRef.current = true;
          onUAEPassSuccess?.(code);
        }
        return false; // cancel further navigation inside webview
      }

      // 3) Open UAE Pass app via custom scheme
      if (contains(urlString, "uaepass://")) {
        // Replace base scheme with environment-specific scheme
        const replaced = urlString.replace("uaepass://", env.uaePassSchemeURL);
        const successurl =
          getParam(urlString, "successurl") ?? externalURLSchemeSuccess();
        const failureurl =
          getParam(urlString, "failureurl") ?? externalURLSchemeFail();

        // The original Swift rebuilt the URL by splitting on "successurl" and appending both params.
        // We’ll simply ensure both success/failure + closeondone=true exist on the query.
        try {
          const u = new URL(replaced);
          u.searchParams.set("successurl", successurl);
          u.searchParams.set("failureurl", failureurl);
          u.searchParams.set("closeondone", "true");

          const finalUrl = u.toString();
          if (canOpenUAEPASS) {
            Linking.openURL(finalUrl);
          } else {
            // Fallback: try opening the raw env scheme if the full one is not supported
            const fallback = env.uaePassSchemeURL;
            if (canOpenUAEPASS) Linking.openURL(fallback);
          }
        } catch {
          // ignore URL parse errors
        }
        return false; // cancel webview navigation
      }

      // 4) Signing finished
      if (contains(urlString, "status=finished")) {
        onSigningCompleted?.();
        return false;
      }

      // 5) status=...
      if (contains(urlString, "status=")) {
        if (contains(urlString, "status=success")) {
          return true; // allow
        } else {
          onUAEPassFailure?.("Signing Failed");
          return false; // cancel
        }
      }

      // 6) External account flows (signup / account-recovery)
      // Swift: allow, and also opens externally if mainDocumentURL present.
      if (
        req.navigationType === "click" &&
        (contains(urlString, "signup") ||
          contains(urlString, "account-recovery"))
      ) {
        try {
          if (canOpenUAEPASS) {
            // Match Swift behavior by allowing the webview AND opening externally.
            // (If you want to avoid double-load, return false instead.)
            Linking.openURL(urlString);
          }
        } catch {
          // ignore
        }
        return true; // keep parity with Swift's .allow
      }

      // 7) Default allow
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

  return (
    <WebView
      source={source}
      originWhitelist={["*"]}
      onShouldStartLoadWithRequest={onShouldStart}
      // Optional: keeps navigation state readable/loggable
      onNavigationStateChange={(nav) => {
        console.log("NAV:", nav.url);
      }}
      {...props}
    />
  );
};
