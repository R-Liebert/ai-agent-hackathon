import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { acceptHMRUpdate, logHMRUpdate } from "./utils/hmr";

import "./index.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/nunito-sans/300.css";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/500.css";
import "@fontsource/nunito-sans/700.css";
import "@fontsource/nunito-sans/900.css";

const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

const render = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

render();

// Enable HMR for development
acceptHMRUpdate("./App", () => {
  logHMRUpdate("App updated, rerendering...");
  render();
});

// Also accept updates to CSS files
if (import.meta.hot) {
  import.meta.hot.accept(["./index.css"], () => {
    logHMRUpdate("CSS updated");
  });
}

reportWebVitals();
