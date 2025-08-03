import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

export default function FetchError({ type }: { type: "network" | "not_found" | "server_error" }) {
  let message = "";
  let animation = null;

  switch (type) {
    case "network":
      message = "No internet connection.";
      animation = require("@/assets/animations/nettworkLost.json");
      break;
    case "not_found":
      message = "The requested content was not found.";
      animation = require("@/assets/animations/notFound.json");
      break;
    case "server_error":
      message = "Oops! Something went wrong on our side.";
      animation = require("@/assets/animations/serverError.json");
      break;
  }

  return (
    <View style={styles.container}>
      <LottieView source={animation} autoPlay loop style={styles.animation} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  animation: {
    width: 200,
    height: 200,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
  },
});
