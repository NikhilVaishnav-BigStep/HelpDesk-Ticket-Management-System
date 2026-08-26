import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { HealthCheckProvider } from "./context/HealthCheckContext";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <HealthCheckProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HealthCheckProvider>
    </BrowserRouter>
  </StrictMode>,
);