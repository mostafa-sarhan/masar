import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { AuthProvider } from "./app/AuthProvider";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import { redirectLegacyHash } from "./app/legacy-hash";
import "./styles/index.css";

redirectLegacyHash();

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
