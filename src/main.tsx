import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "@/app/bootstrap/app";

import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error(
    "Root element not found. Make sure there is an element with id 'root' in your HTML.",
  );
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
