import "@fontsource/roboto/latin-300.css";
import "@fontsource/roboto/latin-400.css";
import "@fontsource/roboto/latin-500.css";
import "@fontsource/roboto/latin-700.css";
import "@material-symbols/font-400/outlined.css";
import "./assets/main.css";
if (__IS_EXTENSION__) {
  import("./assets/crx.css");
}
if (__IS_ANDROID_APP__) {
  const script = document.createElement("script");
  script.src = "cordova.js";
  document.head.appendChild(script);
}
import { createApp } from "vue";
import App from "./App.vue";
import Card from "./components/MdCard.vue";
import "@m3e/web/all";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

const app = createApp(App);
app.component("Card", Card);
app.mount("body");
