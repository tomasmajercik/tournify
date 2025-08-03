import 'dotenv/config';

export default {
  expo: {
    name: "Tournify",
    slug: "tournify",
    icon: "./assets/images/icon.png",
    version: "1.0.0",
    sdkVersion: "53.0.0",
    orientation: "portrait",
    experiments: {
      typedRoutes: true
    },
    extra: {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      "eas":{
        "projectId": "54c22d57-3003-47b4-afe0-f75e0e5a4be8"
      }
    },
    "android": {
      "package": "com.humptee25.tournify"
    },
    "ios": {
      "bundleIdentifier": "com.humptee25.tournify"
    }
  },
};
