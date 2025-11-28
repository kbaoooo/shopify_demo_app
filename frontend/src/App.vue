<script setup>
import { onMounted, ref } from "vue";

const message = ref("Loading...");

onMounted(async () => {
  try {
    const res = await fetch("http://localhost:3000/api/v1/hello");
    const data = await res.json();
    message.value = data.message;
  } catch (e) {
    message.value = "Error calling API";
    console.error(e);
  }
});
</script>

<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue + NestJS base</h1>
    <p>API response: {{ message }}</p>
  </div>
</template>

<style scoped></style>
