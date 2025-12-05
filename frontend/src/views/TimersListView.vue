<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../api/client";

import Button from "primevue/button";
import Card from "primevue/card";
import DataView from "primevue/dataview";
import Message from "primevue/message";
import Tag from "primevue/tag";

interface Timer {
  id: number;
  name: string;
  message: string;
  type: "FIXED" | "EVERGREEN";
  position: string;
  bgColor: string;
  textColor: string;
  status: "ACTIVE" | "INACTIVE";
  startAt?: string;
  endAt?: string;
  evergreenMinutes?: number;
}

const router = useRouter();
const toast = useToast();

const timers = ref<Timer[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const resourcePath = "/countdown-timer";

const typeLabels: Record<Timer["type"], string> = {
  FIXED: "Fixed window",
  EVERGREEN: "Evergreen",
};

const positionLabels: Record<string, string> = {
  TOP_BAR: "Top bar",
  BOTTOM_BAR: "Bottom bar",
  PRODUCT_PAGE: "Product page",
  CART_PAGE: "Cart page",
};

const statusSeverity = (status: Timer["status"]) =>
  status === "ACTIVE" ? "success" : "danger";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDateTime = (value?: string | null) => {
  if (!value) return "Không đặt";
  try {
    return dateFormatter.format(new Date(value));
  } catch (err) {
    console.warn("Cannot format date", err);
    return value;
  }
};

const evergreenLabel = (timer: Timer) =>
  `${timer.evergreenMinutes ?? "?"} phút cho mỗi khách`;

const fetchTimers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get<Timer[]>(resourcePath);
    timers.value = res.data;
  } catch (e: any) {
    const message =
      e?.response?.data?.message || e.message || "Không thể tải danh sách";
    error.value = message;
    toast.add({
      severity: "error",
      summary: "Tải dữ liệu thất bại",
      detail: message,
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
};

const goCreate = () => router.push({ name: "timer-new" });
const goEdit = (id: number) =>
  router.push({ name: "timer-edit", params: { id } });

onMounted(fetchTimers);
</script>

<template>
  <section class="page">
    <!-- Title + button -->
    <div class="section-header">
      <div>
        <h2>Your countdown timers</h2>
        <p>Start by creating your first countdown timer and publishing it.</p>
      </div>
      <Button label="Create a new timer" icon="pi pi-plus" @click="goCreate" />
    </div>

    <!-- Card giống khung lớn trong screenshot -->
    <Card class="timers-card">
      <template #content>
        <Message v-if="error" severity="error" class="mb-3">
          {{ error }}
        </Message>

        <DataView
          :value="timers"
          layout="list"
          paginator
          :rows="6"
          :loading="loading"
          class="timer-dataview"
        >
          <!-- Empty state -->
          <template #empty>
            <div class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-stopwatch" />
              </div>
              <h3>This is where you’ll manage your timers</h3>
              <p>
                Start by creating your first countdown timer and publishing it
                to your store.
              </p>
              <Button
                label="Create a new timer"
                icon="pi pi-plus"
                @click="goCreate"
              />
            </div>
          </template>

          <!-- Khi có timers -->
          <template #list="slotProps">
            <div class="timer-list">
              <article
                v-for="timer in slotProps.items"
                :key="timer.id"
                class="timer-row"
              >
                <div class="row-main">
                  <div class="row-left">
                    <div class="name-cell">
                      <span class="timer-name">{{ timer.name }}</span>
                      <small class="timer-position">
                        {{ positionLabels[timer.position] ?? timer.position }}
                      </small>
                    </div>

                    <div class="meta">
                      <Tag :value="typeLabels[timer.type]" severity="info" />
                      <Tag
                        :value="timer.status"
                        :severity="statusSeverity(timer.status)"
                      />
                    </div>
                    <div class="row-schedule" v-if="timer.type === 'FIXED'">
                      <div>
                        <span class="schedule-label">Start</span>
                        <span class="schedule-value">
                          {{ formatDateTime(timer.startAt) }}
                        </span>
                      </div>
                      <div>
                        <span class="schedule-label">End</span>
                        <span class="schedule-value">
                          {{ formatDateTime(timer.endAt) }}
                        </span>
                      </div>
                    </div>
                    <div class="row-schedule" v-else>
                      <div>
                        <span class="schedule-label">Evergreen</span>
                        <span class="schedule-value">
                          {{ evergreenLabel(timer) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="row-right">
                    <Button
                      icon="pi pi-pencil"
                      size="small"
                      text
                      label="Edit"
                      @click="goEdit(timer.id)"
                    />
                  </div>
                </div>
                <div class="row-preview">
                  <span class="preview-label">Preview</span>
                  <div
                    class="preview-bar"
                    :style="{
                      backgroundColor: timer.bgColor,
                      color: timer.textColor,
                    }"
                  >
                    <span class="preview-text">{{ timer.message }}</span>
                    <span class="preview-countdown">14:48</span>
                  </div>
                </div>
              </article>
            </div>
          </template>
        </DataView>
      </template>
    </Card>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  display: inline-flex;
  padding: 0.6rem 0.9rem;
}

.plan-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-right: 0.2rem;
}
.plan-name {
  font-weight: 600;
}
.plan-note {
  font-size: 0.85rem;
  color: #6b7280;
  margin-left: 0.2rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header h2 {
  margin: 0;
  font-size: 1.1rem;
}
.section-header p {
  margin: 0.25rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.timers-card {
  border-radius: 18px;
  border: none;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  color: #6b7280;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 1.8rem;
  color: #111827;
}

.empty-state h3 {
  margin: 0.5rem 0 0.25rem;
  color: #111827;
}

.timer-dataview {
  width: 100%;
}

.timer-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timer-row {
  position: relative;
  padding: 1.25rem 1.5rem;
  border-radius: 18px;
  border: 1px solid rgba(99, 102, 241, 0.15);
  background: linear-gradient(145deg, #ffffff, #f7f9ff);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  z-index: 0;
}

.timer-row::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at 15% 15%,
    rgba(99, 102, 241, 0.08),
    transparent 50%
  );
  mix-blend-mode: multiply;
  z-index: 0;
}

.timer-row > * {
  position: relative;
  z-index: 1;
}

.row-main {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: center;
}

.row-left {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.row-right {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
}

.name-cell {
  display: flex;
  flex-direction: column;
}
.timer-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: #0f172a;
}
.timer-position {
  font-size: 0.8rem;
  color: #9ca3af;
}

.meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.row-schedule {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.12);
}

.row-schedule div {
  display: flex;
  flex-direction: column;
}

.schedule-label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.schedule-value {
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 500;
}

.row-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.preview-label {
  font-size: 0.8rem;
  color: #9ca3af;
}

.preview-bar {
  padding: 0.75rem 1rem;
  border-radius: 999px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.preview-countdown {
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .row-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .row-right {
    width: 100%;
    justify-content: flex-end;
  }
}

.preview-text {
  max-width: 75%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mb-3 {
  margin-bottom: 1rem;
}
</style>
