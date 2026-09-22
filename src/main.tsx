import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createBrowserRouter } from "react-router";
import App from "@/app/root/app";
import { routes } from "@/app/routing/routes";

import "@/index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error(
    "Root element not found. Make sure there is an element with id 'root' in your HTML.",
  );
}

const router = createBrowserRouter(routes);

createRoot(root).render(
  <StrictMode>
    <App router={router} />
  </StrictMode>,
);
