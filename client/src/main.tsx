import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App";
import { AuthProvider } from "./app/AuthProvider";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <FeedbackProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </FeedbackProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
);
