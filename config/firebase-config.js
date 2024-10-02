// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Import Firebase Authentication

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXtytx7T9a2GeY_5D-tuqzGR7UQJusj0w",
  authDomain: "trijha-new.firebaseapp.com",
  projectId: "trijha-new",
  storageBucket: "trijha-new.appspot.com",
  messagingSenderId: "854907459114",
  appId: "1:854907459114:web:1f138a040978b069fc9553",
  measurementId: "G-ES55BT5BKW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Initialize Firebase Authentication

export { app, auth }; // Export the Firebase app and auth instance
