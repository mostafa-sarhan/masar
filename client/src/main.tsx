import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { AuthProvider } from "./app/AuthProvider";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import { redirectLegacyHash } from "./app/legacy-hash";
import { initMonitoring, captureError } from "./lib/monitoring";
import "./styles/index.css";

redirectLegacyHash();
initMonitoring();
window.addEventListener("unhandledrejection", (e) => captureError(e.reason));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <FeedbackProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </FeedbackProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
