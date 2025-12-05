<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../api/client";

import Button from "primevue/button";
import Calendar from "primevue/calendar";
import Card from "primevue/card";
import ColorPicker from "primevue/colorpicker";
import Dropdown from "primevue/dropdown";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import SelectButton from "primevue/selectbutton";
import TabPanel from "primevue/tabpanel";
import TabView from "primevue/tabview";
import Textarea from "primevue/textarea";

type TimerType = "FIXED" | "EVERGREEN";
type TimerStatus = "ACTIVE" | "INACTIVE";

interface TimerForm {
  name: string;
  message: string;
  type: TimerType;
  startAt: Date | null;
  endAt: Date | null;
  evergreenMinutes: number;
  position: string;
  bgColor: string;
  textColor: string;
  status: TimerStatus;
}

const router = useRouter();
const route = useRoute();
const toast = useToast();

const resourcePath = "/countdown-timer";

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref(0); // 0=Content, 1=Design, 2=Placement

const form = reactive<TimerForm>({
  name: "Timer name",
  message: "🔥 Hurry up! Your cart will be lost in (timer)!",
  type: "EVERGREEN",
  startAt: null,
  endAt: null,
  evergreenMinutes: 15,
  position: "CART_PAGE",
  bgColor: "#111827",
  textColor: "#F9FAFB",
  status: "ACTIVE",
});

const typeOptions = [
  { label: "Evergreen per visitor", value: "EVERGREEN" },
  { label: "Fixed window", value: "FIXED" },
];

const positionCards = [
  {
    value: "PRODUCT_PAGE",
    title: "Product page",
    description: "Block in product page below add to cart button.",
    mockup: "product",
  },
  {
    value: "TOP_BAR",
    title: "Top bar",
    description: "Fixed or sticky bar on the top of any page.",
    mockup: "top",
  },
  {
    value: "BOTTOM_BAR",
    title: "Bottom bar",
    description: "Fixed or sticky bar on the bottom of any page.",
    mockup: "bottom",
  },
  {
    value: "CART_PAGE",
    title: "Cart page",
    description: "Add a countdown timer to cart page.",
    mockup: "cart",
  },
];

const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const title = computed(() => (isEdit.value ? "Timer name" : "Timer name"));

const statusText = computed(() =>
  form.status === "ACTIVE" ? "Active in your store" : "Not active in your store"
);

const previewMessage = computed(
  () => form.message || "🔥 Hurry up! Your cart will be lost in 14:48!"
);

const normalizeHex = (value: string | null | undefined) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const isoOrNull = (value: Date | null) => (value ? value.toISOString() : null);

const loadTimer = async () => {
  if (!isEdit.value) return;
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id;
    const res = await api.get(`${resourcePath}/${id}`);
    const t = res.data;
    form.name = t.name;
    form.message = t.message;
    form.type = t.type;
    form.startAt = t.startAt ? new Date(t.startAt) : null;
    form.endAt = t.endAt ? new Date(t.endAt) : null;
    form.evergreenMinutes = t.evergreenMinutes || 15;
    form.position = t.position;
    form.bgColor = t.bgColor;
    form.textColor = t.textColor;
    form.status = t.status;
  } catch (e: any) {
    error.value =
      e?.response?.data?.message || e.message || "Không thể tải dữ liệu";
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: error.value,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  loading.value = true;
  error.value = null;

  const payload: Record<string, unknown> = {
    name: form.name,
    message: form.message,
    type: form.type,
    position: form.position,
    bgColor: form.bgColor,
    textColor: form.textColor,
    status: form.status,
  };

  if (form.type === "FIXED") {
    payload.startAt = isoOrNull(form.startAt);
    payload.endAt = isoOrNull(form.endAt);
  } else {
    payload.evergreenMinutes = form.evergreenMinutes;
  }

  try {
    if (isEdit.value) {
      const id = route.params.id;
      await api.put(`${resourcePath}/${id}`, payload);
      toast.add({
        severity: "success",
        summary: "Saved",
        detail: "Timer updated",
        life: 2500,
      });
    } else {
      await api.post(resourcePath, payload);
      toast.add({
        severity: "success",
        summary: "Created",
        detail: "New timer is ready",
        life: 2500,
      });
    }
    router.push({ name: "timers" });
  } catch (e: any) {
    error.value =
      e?.response?.data?.message || e.message || "Không thể lưu timer";
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: error.value,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const goBack = () => router.push({ name: "timers" });

onMounted(loadTimer);

watch(
  () => form.bgColor,
  (value) => {
    const normalized = normalizeHex(value);
    if (normalized && normalized !== value) {
      form.bgColor = normalized as string;
    }
  }
);

watch(
  () => form.textColor,
  (value) => {
    const normalized = normalizeHex(value);
    if (normalized && normalized !== value) {
      form.textColor = normalized as string;
    }
  }
);
</script>

<template>
  <section class="page">
    <!-- Header giống “Timer name – Not published / Published” -->
    <div class="header">
      <div class="header-left">
        <Button
          icon="pi pi-chevron-left"
          text
          rounded
          severity="secondary"
          @click="goBack"
        />
        <div class="header-text">
          <h2>{{ title }}</h2>
          <span class="status-line">{{ statusText }}</span>
        </div>
      </div>

      <div class="header-right">
        <SelectButton
          v-model="form.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          class="status-toggle"
        />
        <Button
          :label="isEdit ? 'Save' : 'Create'"
          icon="pi pi-check"
          :loading="loading"
          @click="submit"
        />
      </div>
    </div>

    <Card class="card">
      <template #content>
        <Message v-if="error" severity="error" class="mb-3">
          {{ error }}
        </Message>

        <!-- Tabs Content / Design / Placement -->
        <TabView v-model:activeIndex="activeTab">
          <!-- CONTENT TAB -->
          <TabPanel header="Content">
            <div class="tab-layout">
              <div class="tab-main">
                <div class="field">
                  <label for="name">Countdown name</label>
                  <InputText id="name" v-model="form.name" class="w-full" />
                  <small>
                    Only visible to you. For your own internal reference.
                  </small>
                </div>

                <div class="field">
                  <label for="message">Text</label>
                  <Textarea
                    id="message"
                    v-model="form.message"
                    rows="2"
                    autoResize
                  />
                  <small>
                    Use <code>(timer)</code> where you want to display the
                    countdown.
                  </small>
                </div>

                <div class="field-row">
                  <div class="field">
                    <label for="type">Countdown type</label>
                    <Dropdown
                      id="type"
                      v-model="form.type"
                      :options="typeOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                  </div>

                  <div class="field" v-if="form.type === 'EVERGREEN'">
                    <label for="minutes">Minutes per visitor</label>
                    <InputNumber
                      id="minutes"
                      v-model="form.evergreenMinutes"
                      :min="1"
                      showButtons
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="field-row" v-if="form.type === 'FIXED'">
                  <div class="field">
                    <label for="startAt">Start (optional)</label>
                    <Calendar
                      id="startAt"
                      v-model="form.startAt"
                      showIcon
                      showTime
                      hourFormat="24"
                      class="w-full"
                    />
                  </div>
                  <div class="field">
                    <label for="endAt">End</label>
                    <Calendar
                      id="endAt"
                      v-model="form.endAt"
                      showIcon
                      showTime
                      hourFormat="24"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              <div class="tab-preview">
                <p class="preview-label">Preview</p>
                <div
                  class="preview-bar"
                  :style="{
                    backgroundColor: form.bgColor,
                    color: form.textColor,
                  }"
                >
                  <span>{{ previewMessage }}</span>
                  <span class="preview-countdown">14:48</span>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- DESIGN TAB -->
          <TabPanel header="Design">
            <div class="tab-layout">
              <div class="tab-main">
                <div class="field-row">
                  <div class="field">
                    <label for="bg">Single color background</label>
                    <div class="color-row">
                      <InputText
                        id="bg"
                        v-model="form.bgColor"
                        class="w-full"
                      />
                      <ColorPicker v-model="form.bgColor" format="hex" />
                    </div>
                  </div>

                  <div class="field">
                    <label for="text">Text color</label>
                    <div class="color-row">
                      <InputText
                        id="text"
                        v-model="form.textColor"
                        class="w-full"
                      />
                      <ColorPicker v-model="form.textColor" format="hex" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="tab-preview">
                <p class="preview-label">Preview</p>
                <div
                  class="preview-bar"
                  :style="{
                    backgroundColor: form.bgColor,
                    color: form.textColor,
                  }"
                >
                  <span>{{ previewMessage }}</span>
                  <span class="preview-countdown">14:48</span>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- PLACEMENT TAB -->
          <TabPanel header="Placement">
            <div class="tab-layout">
              <div class="tab-main">
                <div class="field">
                  <label>Select pages to display the timer</label>
                  <div class="cards-grid">
                    <button
                      v-for="card in positionCards"
                      :key="card.value"
                      type="button"
                      class="placement-card"
                      :class="{ active: form.position === card.value }"
                      @click="form.position = card.value"
                    >
                      <div class="placement-thumb">
                        <div class="thumb-screen">
                          <div
                            class="thumb-bar top"
                            :class="{ highlight: card.mockup === 'top' }"
                          />
                          <div class="thumb-body">
                            <div
                              class="thumb-block"
                              :class="[
                                card.mockup === 'product'
                                  ? 'block-product'
                                  : '',
                                card.mockup === 'cart' ? 'block-cart' : '',
                                card.mockup === 'top' ||
                                card.mockup === 'bottom'
                                  ? 'block-placeholder'
                                  : '',
                              ]"
                            />
                          </div>
                          <div
                            class="thumb-bar bottom"
                            :class="{ highlight: card.mockup === 'bottom' }"
                          />
                        </div>
                      </div>
                      <div class="placement-text">
                        <div class="placement-title">{{ card.title }}</div>
                        <div class="placement-desc">
                          {{ card.description }}
                        </div>
                        <span class="placement-link">
                          Select this timer type
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div class="tab-preview">
                <p class="preview-label">Preview</p>
                <div
                  class="preview-bar"
                  :style="{
                    backgroundColor: form.bgColor,
                    color: form.textColor,
                  }"
                >
                  <span>{{ previewMessage }}</span>
                  <span class="preview-countdown">14:48</span>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-text h2 {
  margin: 0;
  font-size: 1.1rem;
}

.status-line {
  font-size: 0.85rem;
  color: #6b7280;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-toggle :deep(.p-button) {
  padding-inline: 0.75rem;
}

.card {
  border-radius: 18px;
  border: none;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.tab-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.3fr);
  gap: 1.5rem;
  margin-top: 1rem;
}

.tab-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.75rem;
}

.field small {
  font-size: 0.75rem;
  color: #6b7280;
}

.color-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-preview {
  align-self: flex-start;
}

.preview-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.35rem;
}

.preview-bar {
  padding: 0.75rem 1rem;
  border-radius: 999px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.preview-countdown {
  font-variant-numeric: tabular-nums;
}

/* placement cards */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.75rem;
}

.placement-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 0.75rem;
  background: #ffffff;
  text-align: left;
  display: flex;
  gap: 0.75rem;
  cursor: pointer;
}

.placement-card.active {
  border-color: #16a34a;
  box-shadow: 0 0 0 1px rgba(22, 163, 74, 0.3);
}

.placement-thumb {
  width: 80px;
}

.thumb-screen {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f9fafb;
}

.thumb-bar {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
}

.thumb-bar.highlight {
  background: #111827;
}

.thumb-body {
  flex: 1;
  border-radius: 4px;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.thumb-block {
  width: 100%;
  height: 16px;
  border-radius: 999px;
  background: #d1d5db;
}

.thumb-block.block-product {
  height: 20px;
  background: #111827;
  align-self: flex-start;
}

.thumb-block.block-cart {
  height: 20px;
  background: #111827;
  align-self: flex-end;
}

.thumb-block.block-placeholder {
  background: #f3f4f6;
}

.placement-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.placement-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.placement-desc {
  font-size: 0.8rem;
  color: #6b7280;
}

.placement-link {
  margin-top: 0.15rem;
  font-size: 0.8rem;
  color: #15803d;
}

.mb-3 {
  margin-bottom: 1rem;
}

@media (max-width: 960px) {
  .tab-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
