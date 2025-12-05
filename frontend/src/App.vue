<script setup>
import Toast from "primevue/toast";
import { useRouter } from "vue-router";

const router = useRouter();

const menuItems = [
  {
    label: "Timers",
    icon: "pi pi-clock",
    command: () => router.push({ name: "timers" }),
  },
  {
    label: "Create",
    icon: "pi pi-plus",
    command: () => router.push({ name: "timer-new" }),
  },
];

const quickCreate = () => router.push({ name: "timer-new" });
</script>

<template>
  <div class="app-shell">
    <Toast />

    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top, #f5f7fb 0, #f7f8fc 42%, #fff 100%);
  padding: 1.5rem;
}

.app-menubar {
  border-radius: 16px;
  margin-bottom: 1.5rem;
  border: none;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.app-content {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
