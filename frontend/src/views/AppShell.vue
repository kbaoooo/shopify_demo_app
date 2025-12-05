<script setup lang="ts">
import Button from "primevue/button";
import Toast from "primevue/toast";
import { useRouter } from "vue-router";

const router = useRouter();

const goList = () => router.push({ name: "timers" });
const goCreate = () => router.push({ name: "timer-new" });
</script>

<template>
  <div class="app-shell">
    <Toast />

    <!-- Thanh trên cùng giống bar app trong Shopify -->
    <header class="topbar">
      <div class="topbar-left" @click="goList">
        <div class="app-icon">
          <i class="pi pi-bolt" />
        </div>
        <div class="app-text">
          <span class="app-title">Essential Countdown Timer Bar</span>
          <span class="app-subtitle">
            Manage simple countdown timers in your store
          </span>
        </div>
      </div>

      <div class="topbar-right">
        <Button
          label="New timer"
          icon="pi pi-plus"
          size="small"
          @click="goCreate"
        />
      </div>
    </header>

    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f6f7fb;
  padding: 1.5rem;
  box-sizing: border-box;
}

.topbar {
  max-width: 1100px;
  margin: 0 auto 1.5rem auto;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.app-icon {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #111827;
  color: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-text {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.app-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
}

.topbar-right {
  display: flex;
  align-items: center;
}

.app-content {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
