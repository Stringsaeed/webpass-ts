import React, { useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import type { UAEPassConfig, UAEPassError, UAEPassResult } from "./types";
import {
  buildAuthUrl,
  extractOriginalCallbackFromResume,
  isFinalRedirect,
  isOurResumeRoute,
  isUAEPassAppScheme,
  parseAuthResult,
  updateURLBasedScheme,
} from "./utils";

export interface UAEPassAuthWebViewProps {
  config: UAEPassConfig;
  onSuccess: (r: UAEPassResult) => void;
  onError: (e: UAEPassError) => void;
  onClose?: () => void;
  userAgent?: string;
}

const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=0.5, maximum-scale=0.5, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta); `;

export const UAEPassAuthWebView: React.FC<UAEPassAuthWebViewProps> = ({
  config,
  onSuccess,
  onError,
  onClose,
  userAgent,
}) => {
  const webRef = useRef<WebView>(null);
  const [uri, setUri] = useState<string>(() => buildAuthUrl(config));
  const scheme = useMemo(
    () => config.appScheme.replace("://", ""),
    [config.appScheme]
  );

  // Handle deep-link resume from UAE PASS app
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (isOurResumeRoute(url, scheme)) {
        try {
          const original = extractOriginalCallbackFromResume(url);
          setUri(original); // send WebView back to UAE PASS Identity Server
        } catch (e) {
          onError({
            error: "resume_parse_error",
            error_description: (e as Error).message,
          });
        }
      }
    });

    // iOS: if app was cold-started from deep link
    (async () => {
      const initUrl = await Linking.getInitialURL();
      if (initUrl && isOurResumeRoute(initUrl, scheme)) {
        try {
          const original = extractOriginalCallbackFromResume(initUrl);
          setUri(original);
        } catch (e) {
          onError({
            error: "resume_parse_error",
            error_description: (e as Error).message,
          });
        }
      }
    })();

    return () => {
      sub.remove?.();
    };
  }, [scheme, onError]);

  const openUAEPassApp = async (originalUrl: string) => {
    try {
      // UAE PASS gives: uaepass://...?successURL=<url1>&failureURL=<url2>&...
      const u = new URL(
        updateURLBasedScheme(originalUrl, config.env ?? "staging")
      );
      const successURL = u.searchParams.get("successurl");
      const failureURL = u.searchParams.get("failureurl");
      if (!successURL || !failureURL)
        throw new Error("Missing successURL/failureURL in uaepass URL");

      const makeResume = (url: string) =>
        `${scheme}:///resume_authn?url=${encodeURIComponent(url)}`;

      u.searchParams.set("successurl", makeResume(successURL));
      u.searchParams.set("failureurl", makeResume(failureURL));

      await Linking.openURL(u.toString());
    } catch (e) {
      onError({
        error: "launch_uaepass_app_failed",
        error_description: (e as Error).message,
      });
    }
  };

  const onNav = (nav: WebViewNavigation) => {
    console.log("onNav ", nav);

    // 1) Intercept uaepass:// handoff, rewrite, and open the UAE PASS app
    if (isUAEPassAppScheme(nav.mainDocumentURL ?? nav.url)) {
      openUAEPassApp(nav.mainDocumentURL ?? nav.url);
      return false; // don't load uaepass:// inside WebView
    }

    // 2) Detect final redirect back to your redirect_uri with ?code=...
    if (isFinalRedirect(nav.mainDocumentURL ?? nav.url, config.redirectUri)) {
      const { code, state, error, error_description } = parseAuthResult(
        nav.mainDocumentURL ?? nav.url
      );
      if (error) onError({ error, error_description, state });
      else if (code) onSuccess({ code, state });
      else
        onError({
          error: "invalid_response",
          error_description: "Missing code and error",
        });
      return false;
    }

    return true;
  };

  return (
    <WebView
      ref={webRef}
      originWhitelist={["*"]}
      source={{ uri }}
      onShouldStartLoadWithRequest={onNav}
      onNavigationStateChange={(navState) => {
        // Android fallback: some RN versions only fire this reliably
        if (Platform.OS === "android") {
          const proceed = onNav(navState as unknown as WebViewNavigation);
          if (!proceed) {
            // cancel by re-pointing to a harmless page
            setTimeout(() => setUri("about:blank"), 0);
          }
        }
      }}
      incognito
      javaScriptEnabled
      domStorageEnabled
      cacheEnabled={false}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      injectedJavaScript={INJECTEDJAVASCRIPT}
      scrollEnabled={false}
      setSupportMultipleWindows={false}
      userAgent={userAgent}
      onError={(e) =>
        onError({
          error: "webview_error",
          error_description: e.nativeEvent.description,
        })
      }
    />
  );
};
