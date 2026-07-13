import React from "react";
import { createRoot } from "react-dom/client";
import "@toolbox/theme/styles.css";
import "@toolbox/theme/toggle.js";
import "@toolbox/nav/nav-bar.css";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
