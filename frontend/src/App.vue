<script setup>
import Toast from "primevue/toast";
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const navItems = [
  {
    name: "timers",
    label: "Timers",
    hint: "Manage & analyze",
  },
  {
    name: "timer-new",
    label: "Create",
    hint: "Launch a new bar",
  },
];

const activeRoute = computed(() => router.currentRoute.value.name);

const goTo = (name) => router.push({ name });
</script>

<template>
  <div class="chrome">
    <div class="glow glow--one" />
    <div class="glow glow--two" />

    <Toast />

    <div class="layout">
      <header class="app-header">
        <div class="identity" @click="goTo('timers')">
          <span class="identity-icon">
            <i class="pi pi-bolt" />
          </span>
          <div>
            <p class="identity-title">Pulse Countdown</p>
            <p class="identity-subtitle">Convert urgency into revenue</p>
          </div>
        </div>

        <nav class="primary-nav">
          <button
            v-for="item in navItems"
            :key="item.name"
            type="button"
            :class="['nav-pill', { active: activeRoute === item.name }]"
            @click="goTo(item.name)"
          >
            <span class="nav-label">{{ item.label }}</span>
            <span class="nav-hint">{{ item.hint }}</span>
          </button>
        </nav>
      </header>

      <main class="app-surface">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.chrome {
  min-height: 100vh;
  background: #05060a;
  position: relative;
  overflow: hidden;
  padding: 2.5rem;
}

.glow {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.55;
}

.glow--one {
  top: -120px;
  left: -80px;
  background: #fdd835;
}

.glow--two {
  bottom: -160px;
  right: -100px;
  background: #f78c6c;
}

.layout {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.app-header {
  background: rgba(8, 9, 15, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  padding: 1.25rem 1.5rem;
  display: flex;
  gap: 1.25rem;
  align-items: center;
  box-shadow: 0 25px 45px rgba(4, 5, 8, 0.55);
  backdrop-filter: blur(32px);
}

.identity {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
}

.identity-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fdd835, #f78c6c);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #ffffff;
}

.identity-title {
  margin: 0;
  font-weight: 600;
  color: #f8fafc;
}

.identity-subtitle {
  margin: 0;
  color: rgba(248, 250, 252, 0.7);
  font-size: 0.82rem;
}

.primary-nav {
  display: flex;
  gap: 0.75rem;
}

.nav-pill {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 0.65rem 0.9rem;
  text-align: left;
  background: transparent;
  color: rgba(241, 245, 249, 0.75);
  font-weight: 500;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.nav-pill.active {
  border-color: transparent;
  background: linear-gradient(120deg, #fdd835, #f78c6c);
  color: #1f1206;
  box-shadow: 0 15px 35px rgba(247, 140, 108, 0.45);
}

.nav-label {
  font-size: 0.9rem;
}

.nav-hint {
  font-size: 0.75rem;
  opacity: 0.8;
}

.app-surface {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 32px;
  padding: 2rem 2.25rem;
  box-shadow: 0 40px 90px rgba(4, 6, 15, 0.35);
}

@media (max-width: 980px) {
  .chrome {
    padding: 1rem;
  }

  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .app-surface {
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .primary-nav {
    width: 100%;
    flex-wrap: wrap;
  }

  .nav-pill {
    flex: 1 1 120px;
  }
}
</style>
