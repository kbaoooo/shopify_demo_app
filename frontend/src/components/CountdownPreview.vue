<script setup lang="ts">
import { PropType, computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "Preview",
  },
  message: {
    type: String,
    required: true,
  },
  bgColor: {
    type: String,
    required: true,
  },
  textColor: {
    type: String,
    required: true,
  },
  positionLabel: {
    type: String,
    required: true,
  },
  timerTypeLabel: {
    type: String,
    required: true,
  },
  countdown: {
    type: String,
    default: "14:48",
  },
  variant: {
    type: String as PropType<"card" | "bare">,
    default: "card",
  },
});

const previewMessage = computed(
  () => props.message || "🔥 Hurry up! Your cart will be lost in 14:48!"
);

const safeBg = computed(() => props.bgColor || "#111827");
const safeText = computed(() => props.textColor || "#f9fafb");
</script>

<template>
  <section class="preview-block">
    <p class="preview-label">{{ title }}</p>
    <div
      :class="['preview-card', variant === 'bare' ? 'preview-card--bare' : '']"
    >
      <div
        class="preview-bar"
        :style="{ backgroundColor: safeBg, color: safeText }"
      >
        <span>{{ previewMessage }}</span>
        <span class="preview-countdown">{{ countdown }}</span>
      </div>
      <div class="preview-meta">
        <span>Position: {{ positionLabel }}</span>
        <span>{{ timerTypeLabel }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.preview-block {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.preview-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.preview-card {
  border-radius: 22px;
  padding: 1.1rem;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.preview-card--bare {
  background: transparent;
  border-style: dashed;
  box-shadow: none;
}

.preview-bar {
  padding: 0.85rem 1.2rem;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-weight: 600;
  font-size: 0.95rem;
  min-height: 56px;
}

.preview-bar span:first-child {
  flex: 1;
}

.preview-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #475467;
}

.preview-countdown {
  font-variant-numeric: tabular-nums;
}
</style>
