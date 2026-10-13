// Configure Firebase Authentication before enabling phone OTP.
// Create a Firebase project, enable Authentication > Phone, add your site domain,
// and replace the placeholder values below with your Firebase web app config.
export const firebaseConfig = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_PROJECT_ID",
  appId: "REPLACE_WITH_FIREBASE_APP_ID"
};

// Replace with the URL of your deployed Cloudflare Worker API.
export const apiBaseUrl = "";
