<script setup>
import "@/assets/card.css";
import { ref } from "vue";
const props = defineProps({
  id: String,
  icon: String,
  Background: String,
  TextColor: String,
  Width: String,
  Height: String,
  Other: Object //css
});

const cardStyle = ref({});
cardStyle.value = {
  background: props.Background,
  width: props.Width,
  height: props.Height,
  ...props.Other
};
</script>

<template>
  <m3e-card :id="id" class="baseCard" variant="filled" :style="cardStyle">
    <m3e-icon
      class="cardIcon"
      v-if="props.icon"
      :name="props.icon"
      style="font-size: 140px"
    ></m3e-icon>
    <div class="cardContent" :style="{ color: props.TextColor, 'z-index': 5 }">
      <slot></slot>
    </div>
  </m3e-card>
</template>
