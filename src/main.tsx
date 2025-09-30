import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider, ThemeProvider, SupervisorProvider, AuthProvider } from "./contexts";
import "./global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <SupervisorProvider>
            <App />
          </SupervisorProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
