import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/app/app";
import { appRouter } from "@/app/app-router";
import { assertAuthRuntimeConfig } from "@/features/auth/config/auth-runtime-config";

import "@/index.css";

assertAuthRuntimeConfig(import.meta.env);

const root = document.getElementById("root");

if (!root) {
  throw new Error(
    "Root element not found. Make sure there is an element with id 'root' in your HTML.",
  );
}

createRoot(root).render(
  <StrictMode>
    <App router={appRouter} />
  </StrictMode>,
);
