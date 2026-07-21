<script setup>
import "@/assets/ImMainView.css";
import HomeView from "@/views/HomeView.vue";
</script>

<template>
  <div id="ImWindowContainer" ref="ImContainer">
    <div id="ImContentContainer">
      <div id="main_content">
        <HomeView />
      </div>
    </div>
  </div>
</template>
