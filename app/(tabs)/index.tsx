import { Appearance, Button, StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useRouter } from "expo-router";
import { UAEPass } from "react-native-uaepass";

Appearance.setColorScheme("dark");

const UAEPassConfig = {
  env: "staging", // or production // default staging
  clientId: "sandbox_stage",
  redirectURL: "com.anonymous.webpassts://uaepass",
  successHost: "uaePassSuccess",
  failureHost: "uaePassFail",
  scheme: "webpassts",
  scope: "urn:uae:digitalid:profile",
  locale: "en",
  useAndroidCustomWebView: false,
};

export default function HomeScreen() {
  const router = useRouter();

  const login = async () => {
    try {
      const response = await UAEPass.login(UAEPassConfig);
      console.log("[UAE PASS React Native] response", response);
    } catch (e) {
      console.log("error", e);
    }
  };
  return (
    <ThemedView style={styles.container}>
      <Button
        title="Use react-native-uaepass"
        onPress={() => {
          login();
        }}
      />
      <Button
        title="Use uaepass-typescript"
        onPress={() => {
          router.push("/modal");
        }}
      />
      <Button
        title="Use uaepass-typescript-v2"
        onPress={() => {
          router.push("/modal-v2");
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
