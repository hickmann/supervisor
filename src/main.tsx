import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider, ThemeProvider, SupervisorProvider } from "./contexts";
import "./global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <SupervisorProvider>
          <App />
        </SupervisorProvider>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>
);
