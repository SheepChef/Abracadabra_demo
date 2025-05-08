<script setup>
import { ref, onMounted, onBeforeMount } from "vue";
import "mdui/mdui.css";
//import "mdui";
//import "@mdui/icons/menu.js";
import "@/assets/mdui-icon.css";
import "@/assets/main.css";
//import "mdui/components/divider.js";
import "mdui/components/layout.js";
import ImMainView from "@/components/ImMainView.vue";

onMounted(() => {});
</script>

<template>
  <header><link rel="shortcut icon" href="favicon.ico" /></header>
  <mdui-layout style="width: 100% !important; height: 100%">
    <!-- 内部界面，是框架的消息部分 -->
    <mdui-layout-main class="InnerUI" fullHeight>
      <!--主要组件-->

      <ImMainView />
    </mdui-layout-main>
  </mdui-layout>
</template>
