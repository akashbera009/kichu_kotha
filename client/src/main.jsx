import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { FCMProvider } from "./context/FCMContext";

createRoot(document.getElementById("root")).render(
  <FCMProvider>
    <App />
  </FCMProvider>
);

// index.js (or main.jsx)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((reg) => {
      console.log("SW registered:", reg.scope);
    })
    .catch((err) => {
      console.error("SW registration failed:", err);
    });
}
