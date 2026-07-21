<script setup>
import { ref, provide } from "vue";
import "@/assets/main.css";
import ImMainView from "@/components/ImMainView.vue";

const themeColor = ref(localStorage.getItem("abra-theme-color") || "#64B5F6");
const themeScheme = ref(localStorage.getItem("abra-theme-scheme") || "dark");

const setThemeColor = (color) => {
  themeColor.value = color;
  localStorage.setItem("abra-theme-color", color);
};

const setThemeScheme = (scheme) => {
  themeScheme.value = scheme;
  localStorage.setItem("abra-theme-scheme", scheme);
};

provide("themeColor", themeColor);
provide("themeScheme", themeScheme);
provide("setThemeColor", setThemeColor);
provide("setThemeScheme", setThemeScheme);
</script>

<template>
  <header>
    <link rel="shortcut icon" href="favicon.ico" />
  </header>
  <m3e-theme :color="themeColor" variant="vibrant" :scheme="themeScheme" motion="expressive"
    style="min-height: 100vh; display: block; ">
    <div class="InnerUI" :class="themeScheme" style="min-height: 100vh;">
      <ImMainView />
    </div>
  </m3e-theme>
</template>
