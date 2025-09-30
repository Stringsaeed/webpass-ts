import { ThemedView } from "@/components/themed-view";
import { UAEPassWebView } from "@/components/UAEPassWebview";
import {
  getUAEPassConfig,
  getUAEPassConfiguration,
  UAEPassEnvironment,
  UAEPASSRouterLike,
  UAEPassServiceType,
} from "@/utils/uaepass";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, StyleSheet } from "react-native";
import { WebViewProps } from "react-native-webview";

const INJECTEDJAVASCRIPT = `const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=0.5, maximum-scale=0.5, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta); `;

export const UAEPASSRouter: UAEPASSRouterLike = {
  environmentConfig: getUAEPassConfig({
    clientID: "sandbox_stage",
    env: UAEPassEnvironment.staging,
  }),
  spConfig: {
    redirectUriLogin: "webpassts://modal",
    state: "dsadsadasdasdaa",
    loginScope: "urn:uae:digitalid:profile",
  },
  sdkLang: "en",
};

export default function ModalScreen() {
  const { code } = useLocalSearchParams();

  const [source, setSource] = useState<WebViewProps["source"]>({ uri: "" });
  const [canOpenUAEPASS, setCanOpenUAEPASS] = useState(false);

  useEffect(() => {
    Linking.canOpenURL(UAEPASSRouter.environmentConfig.uaePassSchemeURL).then(
      (canOpen) => {
        setCanOpenUAEPASS(canOpen);
        const uri = getUAEPassConfiguration(
          UAEPassServiceType.loginURL,
          UAEPASSRouter,
          canOpen
        );
        console.log("uri", uri);
        setSource({ uri });
      }
    );
  }, []);

  useEffect(() => {
    Linking.addEventListener("url", (event) => {
      console.log("url", event);
      if (event.url.includes("code=")) {
        const code = event.url.split("code=")[1];
        console.log("code", code);
        router.back();
      }
    });
  }, []);
  useEffect(() => {
    if (code) {
      console.log("code:", code);
      router.back();
    }
  }, [code]);

  return (
    <ThemedView style={styles.container}>
      <UAEPassWebView
        config={UAEPASSRouter}
        canOpenUAEPASS={canOpenUAEPASS}
        style={styles.webView}
        source={source}
        injectedJavaScript={INJECTEDJAVASCRIPT}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onUAEPassSuccess={(event) => {
          console.log("onUAEPassSuccess:", event);
          router.back();
        }}
        onUAEPassFailure={(event) => {
          console.log("onUAEPassFailure:", event);
          router.back();
        }}
        onSigningCompleted={() => {
          router.back();
          console.log("onSigningCompleted");
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
