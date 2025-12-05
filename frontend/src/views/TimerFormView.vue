const trimName = (value?: string | null) => (value ?? "").trim(); const
BRAND_HIGHLIGHT = "#f7b044";
<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
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
import CountdownPreview from "../components/CountdownPreview.vue";

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

interface ActivationConflictResponse {
  code: "POSITION_ALREADY_ACTIVE";
  message: string;
  position: string;
  conflictingTimer: {
    id: number;
    name: string;
    status: TimerStatus;
    position: string;
  };
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
  type: "FIXED",
  startAt: null,
  endAt: null,
  evergreenMinutes: 15,
  position: "TOP_BAR",
  bgColor: "#111827",
  textColor: "#F9FAFB",
  status: "INACTIVE",
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

const resolvePositionLabel = (value: string) =>
  positionCards.find((card) => card.value === value)?.title || value;

const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const conflictModalVisible = ref(false);
const conflictDetails = ref<ActivationConflictResponse | null>(null);
const forceSwitchLoading = ref(false);
const pendingSubmitPayload = ref<Record<string, unknown> | null>(null);

const title = computed(() =>
  isEdit.value ? "Refine countdown" : "Create countdown"
);

const statusText = computed(() =>
  form.status === "ACTIVE" ? "Active in your store" : "Not active in your store"
);

const previewMessage = computed(
  () => form.message || "🔥 Hurry up! Your cart will be lost in 14:48!"
);

const previewPositionLabel = computed(
  () => resolvePositionLabel(form.position) || "Top bar"
);

const previewTypeLabel = computed(() =>
  form.type === "FIXED" ? "Fixed window" : "Evergreen per visitor"
);

const normalizeHex = (value: string | null | undefined) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
};

const trimName = (value?: string | null) => (value ?? "").trim();
const BRAND_HIGHLIGHT = "#f7b044";

const isoOrNull = (value: Date | null) => (value ? value.toISOString() : null);

const loadTimer = async () => {
  if (!isEdit.value) return;
  loading.value = true;
  error.value = null;
  try {
    const id = route.params.id;
    const res = await api.get(`${resourcePath}/${id}`);
    const t = res.data;
    const trimmedName = trimName(t.name);
    form.name = trimmedName || form.name;
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
      e?.response?.data?.message || e.message || "Unable to load timer";
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.value,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const persistTimer = async (payload: Record<string, unknown>) => {
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
};

const handleSubmitError = (
  err: any,
  payload: Record<string, unknown>
): boolean => {
  const response = err?.response?.data;
  const statusCode = err?.response?.status;

  if (statusCode === 409 && response?.code === "POSITION_ALREADY_ACTIVE") {
    const message =
      response?.message || "There is already an active timer on this position.";
    if (isEdit.value) {
      pendingSubmitPayload.value = payload;
      conflictDetails.value = response as ActivationConflictResponse;
      conflictModalVisible.value = true;
    } else {
      error.value = message;
      toast.add({
        severity: "error",
        summary: "Cannot activate",
        detail: message,
        life: 4000,
      });
    }
    return true;
  }

  if (statusCode === 400 && response?.code === "MAX_TIMERS_REACHED") {
    const message =
      response?.message ||
      "You have reached the maximum number of timers for this store.";
    error.value = message;
    toast.add({
      severity: "error",
      summary: "Cannot create timer",
      detail: message,
      life: 4000,
    });
    return true;
  }

  return false;
};

const dismissConflictModal = () => {
  if (forceSwitchLoading.value) return;
  conflictModalVisible.value = false;
  conflictDetails.value = null;
  pendingSubmitPayload.value = null;
};

const confirmForceSwitch = async () => {
  if (!isEdit.value || !pendingSubmitPayload.value) return;
  const id = route.params.id;
  forceSwitchLoading.value = true;
  try {
    await api.post(`${resourcePath}/${id}/force-activate`);
    const payload = { ...pendingSubmitPayload.value };
    pendingSubmitPayload.value = null;
    conflictModalVisible.value = false;
    await persistTimer(payload);
  } catch (err: any) {
    const message =
      err?.response?.data?.message || err.message || "Unable to switch timers";
    toast.add({
      severity: "error",
      summary: "Switch failed",
      detail: message,
      life: 4000,
    });
  } finally {
    forceSwitchLoading.value = false;
  }
};

const submit = async () => {
  loading.value = true;
  error.value = null;

  const normalizedName = trimName(form.name);
  if (!normalizedName) {
    loading.value = false;
    error.value = "Countdown name cannot be empty.";
    toast.add({
      severity: "error",
      summary: "Name required",
      detail: error.value,
      life: 3500,
    });
    return;
  }
  form.name = normalizedName;

  const payload: Record<string, unknown> = {
    name: normalizedName,
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
    await persistTimer(payload);
  } catch (e: any) {
    if (handleSubmitError(e, payload)) {
      return;
    }
    error.value =
      e?.response?.data?.message || e.message || "Unable to save timer";
    toast.add({
      severity: "error",
      summary: "Error",
      detail: error.value,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const goBack = () => router.push({ name: "timers" });

// load data
onMounted(loadTimer);

// nudge activeTab để PrimeVue cập nhật lại ink-bar lần đầu
onMounted(async () => {
  await nextTick(); // đợi TabView render xong
  const original = activeTab.value; // thường là 0
  activeTab.value = original === 0 ? 1 : 0; // chuyển tạm tab khác
  await nextTick(); // để ink-bar update
  activeTab.value = original; // trả về tab ban đầu
});

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
    <header class="editor-hero">
      <div class="hero-left">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          severity="secondary"
          class="ghost"
          @click="goBack"
        />
        <div>
          <p class="eyebrow">Timer workspace</p>
          <h2>{{ title }}</h2>
          <span class="status-pill" :class="form.status.toLowerCase()">
            {{ statusText }}
          </span>
        </div>
      </div>

      <div class="hero-right">
        <SelectButton
          v-model="form.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          class="status-toggle"
        />
        <Button
          :label="isEdit ? 'Save changes' : 'Launch timer'"
          icon="pi pi-check"
          :loading="loading"
          class="primary-launch"
          @click="submit"
        />
      </div>
    </header>

    <Card class="card builder-card">
      <template #content>
        <Message v-if="error" severity="error" class="mb-3">
          {{ error }}
        </Message>

        <!-- Tabs Content / Design / Placement -->
        <TabView v-model:activeIndex="activeTab" class="builder-tabs">
          <!-- CONTENT TAB -->
          <TabPanel header="Content">
            <div class="tab-layout content-layout">
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

                <div class="inline-preview">
                  <CountdownPreview
                    title="Live preview"
                    :message="previewMessage"
                    :bg-color="form.bgColor"
                    :text-color="form.textColor"
                    :position-label="previewPositionLabel"
                    :timer-type-label="previewTypeLabel"
                    variant="bare"
                  />
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- DESIGN TAB -->
          <TabPanel header="Design">
            <div class="tab-layout content-layout">
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
                      <ColorPicker
                        v-model="form.bgColor"
                        format="hex"
                        class="color-swatch"
                        :style="{ '--swatch-border': BRAND_HIGHLIGHT }"
                      />
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
                      <ColorPicker
                        v-model="form.textColor"
                        format="hex"
                        class="color-swatch"
                        :style="{ '--swatch-border': BRAND_HIGHLIGHT }"
                      />
                    </div>
                  </div>
                </div>

                <div class="inline-preview">
                  <CountdownPreview
                    title="Design preview"
                    :message="previewMessage"
                    :bg-color="form.bgColor"
                    :text-color="form.textColor"
                    :position-label="previewPositionLabel"
                    :timer-type-label="previewTypeLabel"
                    variant="bare"
                  />
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- PLACEMENT TAB -->
          <TabPanel header="Placement">
            <div class="tab-layout content-layout">
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
                        <div class="placement-title">
                          {{ card.title }}
                        </div>
                        <div class="placement-desc">
                          {{ card.description }}
                        </div>
                        <span class="placement-link">
                          {{
                            form.position === card.value
                              ? "Selected"
                              : "Use this placement"
                          }}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div class="inline-preview">
                  <CountdownPreview
                    title="Placement preview"
                    :message="previewMessage"
                    :bg-color="form.bgColor"
                    :text-color="form.textColor"
                    :position-label="previewPositionLabel"
                    :timer-type-label="previewTypeLabel"
                    variant="bare"
                  />
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </template>
    </Card>
    <div
      v-if="conflictModalVisible && conflictDetails"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Switch active timer"
    >
      <div class="modal__backdrop" @click="dismissConflictModal"></div>
      <div class="modal__card" @click.stop>
        <div class="modal__icon">
          <i class="pi pi-bolt" />
        </div>
        <h3>Switch active timer?</h3>
        <p>
          There is already an active timer on
          {{ resolvePositionLabel(conflictDetails.position) }}:
          <strong>{{ conflictDetails.conflictingTimer.name }}</strong
          >.
        </p>
        <p>
          Do you want to deactivate it and activate "{{ form.name }}" instead?
        </p>
        <div class="modal__actions">
          <button
            type="button"
            class="ghost"
            @click="dismissConflictModal"
            :disabled="forceSwitchLoading"
          >
            Cancel
          </button>
          <button
            type="button"
            class="primary"
            @click="confirmForceSwitch"
            :disabled="forceSwitchLoading"
          >
            <i v-if="forceSwitchLoading" class="pi pi-spin pi-spinner" />
            Switch timers
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.hero-left h2 {
  margin: 0.2rem 0 0;
  font-size: 1.6rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c8aad;
}

.status-pill {
  display: inline-flex;
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.35rem;
}

.status-pill.active {
  background: rgba(34, 197, 94, 0.2);
  color: #0f5132;
}

.status-pill.inactive {
  background: rgba(248, 113, 113, 0.2);
  color: #991b1b;
}

.hero-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.hero-right :deep(.primary-launch.p-button) {
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #fdd835, #f78c6c);
  color: #1f1206;
  box-shadow: 0 18px 40px rgba(247, 140, 108, 0.35);
  font-weight: 700;
  padding: 0.65rem 1.4rem;
}

.hero-right :deep(.primary-launch.p-button:hover),
.hero-right :deep(.primary-launch.p-button:focus),
.hero-right :deep(.primary-launch.p-button:active) {
  background: linear-gradient(135deg, #fbc02d, #f97316);
  color: #1f1206;
  box-shadow: 0 22px 45px rgba(249, 115, 22, 0.4);
}

.hero-right :deep(.primary-launch.p-button:focus-visible) {
  outline: 2px solid rgba(251, 191, 36, 0.8);
  outline-offset: 2px;
}

.hero-left :deep(.ghost.p-button) {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  color: #0f172a;
}

.status-toggle :deep(.p-button) {
  padding-inline: 0.75rem;
}

.builder-card {
  border-radius: 28px;
  border: none;
  box-shadow: 0 35px 60px rgba(15, 23, 42, 0.15);
  background: #ffffff;
}

/* ===== TABVIEW CUSTOM (ink-bar) ===== */

.builder-tabs :deep(.p-tabview-nav-container) {
  border-bottom: none; /* bỏ line xám toàn width */
}

.builder-tabs :deep(.p-tabview-nav) {
  border: none;
  gap: 0.35rem;
}

.builder-tabs :deep(.p-tabview-nav li .p-tabview-nav-link) {
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 0.55rem 1.2rem;
  font-weight: 600;
}

.builder-tabs :deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  border-color: transparent;
  background: #ffffff;
  color: #111827;
}

/* ink-bar gradient chạy dưới tab active */
.builder-tabs :deep(.p-tabview-ink-bar) {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fdd835, #f78c6c);
}

/* ===== layout / fields ===== */

.tab-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1.3fr);
  gap: 1.5rem;
  margin-top: 1rem;
}

.tab-layout.content-layout {
  grid-template-columns: minmax(0, 1fr);
}

.tab-main {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inline-preview {
  margin-top: 1.25rem;
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
  padding: 0.2rem 0;
}

.color-row :deep(.color-swatch) {
  display: inline-flex;
  padding: 0;
  border: none;
  background: transparent;
  --p-colorpicker-preview-focus-ring-color: var(--swatch-border, #f7b044);
}

.color-row :deep(.color-swatch .p-colorpicker-preview) {
  border-radius: 8px;
  overflow: hidden;
  width: 36px;
  height: 36px;
  border: 2px solid var(--swatch-border, #f7b044);
  box-shadow: 0 4px 12px rgba(247, 176, 68, 0.25);
}

.color-row :deep(.p-colorpicker) {
  border: none;
}

.tab-preview {
  align-self: flex-start;
  position: sticky;
  top: 2rem;
}

.inline-preview {
  margin-top: 1.25rem;
}

/* placement cards */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.75rem;
}

.placement-card {
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  padding: 0.9rem;
  background: #ffffff;
  text-align: left;
  display: flex;
  gap: 0.9rem;
  cursor: pointer;
  box-shadow: 0 15px 25px rgba(15, 23, 42, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.placement-card:hover {
  transform: translateY(-4px);
}

.placement-card.active {
  border-color: rgba(253, 216, 53, 0.8);
  box-shadow: 0 18px 40px rgba(247, 140, 108, 0.3);
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
  color: #a16207;
}

.mb-3 {
  margin-bottom: 1rem;
}

.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
}

.modal__card {
  position: relative;
  width: min(420px, calc(100% - 2rem));
  background: #fff;
  border-radius: 28px;
  padding: 1.75rem;
  box-shadow: 0 35px 70px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  z-index: 1;
  text-align: center;
}

.modal__icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  margin: 0 auto;
  background: rgba(251, 191, 36, 0.16);
  color: #a16207;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.modal__actions .ghost,
.modal__actions .primary {
  border-radius: 999px;
  padding: 0.55rem 1.4rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.modal__actions .ghost {
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: transparent;
  color: #0f172a;
}

.modal__actions .primary {
  border: none;
  background: linear-gradient(135deg, #fdd835, #f78c6c);
  color: #1f1206;
  box-shadow: 0 18px 35px rgba(247, 140, 108, 0.35);
}

.modal__actions button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 960px) {
  .tab-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .tab-preview {
    position: static;
  }
}
</style>
