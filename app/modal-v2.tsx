import { UAEPassAuthWebView } from "@/components/V2/V2";
import { View } from "react-native";

export default function ModalScreenV2() {
  return (
    <View style={{ flex: 1 }}>
      <UAEPassAuthWebView
        config={{
          env: "staging",
          clientId: "sandbox_stage",
          redirectUri: "com.anonymous.webpassts://uaepass",
          appScheme: "webpassts", // register this deep link in iOS/Android
          scope: "urn:uae:digitalid:profile:general",
          acrValues: "urn:digitalid:authentication:flow:mobileondevice",
          uiLocales: "en",
          state: Math.random().toString(36).substring(2, 15),
        }}
        onSuccess={({ code, state }) => {
          console.log("code", code);
          console.log("state", state);
          // Exchange code for tokens on your backend:
          // POST /token -> { grant_type: 'authorization_code', redirect_uri, code }
        }}
        onError={(e) => {
          console.warn("UAE PASS error", e);
        }}
      />
    </View>
  );
}
