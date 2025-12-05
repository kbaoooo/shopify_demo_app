<script setup lang="ts">
import { useToast } from "primevue/usetoast";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../api/client";

import DataView from "primevue/dataview";

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

interface PaginatedTimersResponse {
  items: Timer[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  orderBy?: string;
}

interface ActivationConflict {
  code: "POSITION_ALREADY_ACTIVE";
  message: string;
  position: string;
  conflictingTimer: {
    id: number;
    name: string;
    status: Timer["status"];
    position: string;
  };
}

interface TimerTotalsResponse {
  active: number;
  inactive: number;
  total: number;
}

interface PageEventPayload {
  first: number;
  rows: number;
  page?: number;
}

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 15, 20];

const router = useRouter();
const toast = useToast();

const timers = ref<Timer[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const currentPage = ref(1);
const rowsPerPage = ref(DEFAULT_PAGE_SIZE);
const totalRecords = ref(0);
const firstItemIndex = computed(
  () => (currentPage.value - 1) * rowsPerPage.value
);
const activeMenuId = ref<number | null>(null);
const confirmVisible = ref(false);
const confirmTarget = ref<Timer | null>(null);
const deleteLoading = ref(false);
const confirmError = ref<string | null>(null);
const toggleLoadingId = ref<number | null>(null);
const totalsLoading = ref(false);
const totalsError = ref<string | null>(null);
const timerTotals = ref<TimerTotalsResponse>({
  active: 0,
  inactive: 0,
  total: 0,
});
const conflictVisible = ref(false);
const activationConflict = ref<ActivationConflict | null>(null);
const conflictTarget = ref<Timer | null>(null);
const forceActivateLoading = ref(false);

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

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not set";
  try {
    return dateFormatter.format(new Date(value));
  } catch (err) {
    console.warn("Cannot format date", err);
    return value;
  }
};

const evergreenLabel = (timer: Timer) =>
  `${timer.evergreenMinutes ?? "?"} minutes per shopper`;

const fetchTimers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get<PaginatedTimersResponse>(resourcePath, {
      params: {
        page: currentPage.value,
        size: rowsPerPage.value,
      },
    });
    const payload = res.data;
    timers.value = payload.items ?? [];
    totalRecords.value = payload.totalItems ?? timers.value.length;
    rowsPerPage.value = payload.size ?? rowsPerPage.value;
    currentPage.value = payload.page ?? currentPage.value;
  } catch (e: any) {
    const message =
      e?.response?.data?.message || e.message || "Unable to load timers";
    error.value = message;
    toast.add({
      severity: "error",
      summary: "Failed to load data",
      detail: message,
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
};

const fetchTotals = async () => {
  totalsLoading.value = true;
  totalsError.value = null;
  try {
    const res = await api.get<TimerTotalsResponse>(`${resourcePath}/total`);
    timerTotals.value = res.data;
  } catch (e: any) {
    const message =
      e?.response?.data?.message || e.message || "Unable to load metrics";
    totalsError.value = message;
    toast.add({
      severity: "error",
      summary: "Failed to load metrics",
      detail: message,
      life: 3500,
    });
  } finally {
    totalsLoading.value = false;
  }
};

const handlePage = async (event: PageEventPayload) => {
  const zeroBasedPage =
    event.page !== undefined
      ? event.page
      : Math.floor(event.first / Math.max(event.rows, 1));
  const nextPage = zeroBasedPage + 1;

  if (
    nextPage === currentPage.value &&
    event.rows === rowsPerPage.value &&
    timers.value.length > 0
  ) {
    return;
  }

  currentPage.value = nextPage;
  const desiredRows = event.rows ?? rowsPerPage.value;
  rowsPerPage.value = Math.min(
    Math.max(desiredRows, PAGE_SIZE_OPTIONS[0]),
    PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1]
  );
  await fetchTimers();
};

const toggleActionMenu = (id: number) => {
  activeMenuId.value = activeMenuId.value === id ? null : id;
};

const closeActionMenu = () => {
  activeMenuId.value = null;
};

const handleDocumentClick = () => {
  closeActionMenu();
};

const startEdit = (id: number) => {
  closeActionMenu();
  goEdit(id);
};

const promptDelete = (timer: Timer) => {
  closeActionMenu();
  confirmTarget.value = timer;
  confirmError.value = null;
  confirmVisible.value = true;
};

const hideDeleteConfirm = (force = false) => {
  if (deleteLoading.value && !force) return;
  confirmVisible.value = false;
  confirmTarget.value = null;
  confirmError.value = null;
};

const confirmDelete = async () => {
  if (!confirmTarget.value) return;
  deleteLoading.value = true;
  confirmError.value = null;
  try {
    await api.delete(`${resourcePath}/${confirmTarget.value.id}`);
    toast.add({
      severity: "success",
      summary: "Timer removed",
      detail: `${confirmTarget.value.name} has been deleted.`,
      life: 2200,
    });
    hideDeleteConfirm(true);
    await fetchTimers();
    await fetchTotals();
  } catch (e: any) {
    const message =
      e?.response?.data?.message || e.message || "Unable to delete timer";
    confirmError.value = message;
    toast.add({
      severity: "error",
      summary: "Delete failed",
      detail: message,
      life: 3500,
    });
  } finally {
    deleteLoading.value = false;
  }
};

const handleActivationConflict = (
  timer: Timer,
  conflict: ActivationConflict
) => {
  conflictTarget.value = timer;
  activationConflict.value = conflict;
  conflictVisible.value = true;
};

const hideConflictModal = (force = false) => {
  if (forceActivateLoading.value && !force) return;
  conflictVisible.value = false;
  activationConflict.value = null;
  conflictTarget.value = null;
};

const toggleTimerStatus = async (timer: Timer) => {
  closeActionMenu();
  toggleLoadingId.value = timer.id;
  const nextStatus = timer.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    await api.patch(`${resourcePath}/${timer.id}`);
    toast.add({
      severity: nextStatus === "ACTIVE" ? "success" : "info",
      summary: nextStatus === "ACTIVE" ? "Timer activated" : "Timer paused",
      detail: `${timer.name} is now ${nextStatus.toLowerCase()}.`,
      life: 2200,
    });
    await fetchTimers();
    await fetchTotals();
  } catch (e: any) {
    const response = e?.response?.data;
    if (
      e?.response?.status === 409 &&
      response?.code === "POSITION_ALREADY_ACTIVE"
    ) {
      handleActivationConflict(timer, response as ActivationConflict);
    } else {
      const message =
        response?.message || e.message || "Unable to update timer status";
      toast.add({
        severity: "error",
        summary: "Status update failed",
        detail: message,
        life: 3500,
      });
    }
  } finally {
    toggleLoadingId.value = null;
  }
};

const confirmForceActivate = async () => {
  if (!conflictTarget.value) return;
  forceActivateLoading.value = true;
  try {
    await api.post(`${resourcePath}/${conflictTarget.value.id}/force-activate`);
    toast.add({
      severity: "success",
      summary: "Timers switched",
      detail: `${conflictTarget.value.name} is now live on that position.`,
      life: 2200,
    });
    hideConflictModal(true);
    await fetchTimers();
    await fetchTotals();
  } catch (e: any) {
    const message =
      e?.response?.data?.message || e.message || "Unable to switch timers";
    toast.add({
      severity: "error",
      summary: "Switch failed",
      detail: message,
      life: 3500,
    });
  } finally {
    forceActivateLoading.value = false;
  }
};

const goCreate = () => router.push({ name: "timer-new" });
const goEdit = (id: number) =>
  router.push({ name: "timer-edit", params: { id } });
const refreshOverview = () => {
  fetchTotals();
  fetchTimers();
};

onMounted(() => {
  fetchTimers();
  fetchTotals();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<template>
  <section class="page">
    <header class="hero">
      <div class="hero-text">
        <p class="eyebrow">Conversion studio</p>
        <h1>Design urgency with confidence</h1>
        <p>
          Craft personalized countdown experiences for any touchpoint. Track
          what performs, iterate visuals, and ship timers that feel native to
          your storefront.
        </p>

        <div class="hero-actions">
          <button type="button" class="cta-primary" @click="goCreate">
            <i class="pi pi-plus" />
            New timer
          </button>
          <button type="button" class="ghost" @click="refreshOverview">
            <i class="pi pi-refresh" />
            Refresh data
          </button>
        </div>
      </div>

      <div class="hero-stats">
        <div class="stat-card" :class="{ 'stat-card--loading': totalsLoading }">
          <span class="stat-label">Active timers</span>
          <strong>{{ totalsLoading ? "—" : timerTotals.active }}</strong>
          <small>Live across all surfaces</small>
        </div>
        <div class="stat-card" :class="{ 'stat-card--loading': totalsLoading }">
          <span class="stat-label">Inactive timers</span>
          <strong>{{ totalsLoading ? "—" : timerTotals.inactive }}</strong>
          <small>Snoozed but ready to relaunch</small>
        </div>
        <div class="stat-card" :class="{ 'stat-card--loading': totalsLoading }">
          <span class="stat-label">Total timers</span>
          <strong>{{ totalsLoading ? "—" : timerTotals.total }}</strong>
          <small>All countdown campaigns</small>
        </div>
      </div>
      <p v-if="totalsError" class="stats-error">{{ totalsError }}</p>
    </header>

    <div class="timers-panel">
      <DataView
        :value="timers"
        layout="list"
        paginator
        lazy
        :rows="rowsPerPage"
        :rowsPerPageOptions="PAGE_SIZE_OPTIONS"
        :first="firstItemIndex"
        :totalRecords="totalRecords"
        :loading="loading"
        class="timer-dataview"
        @page="handlePage"
      >
        <template #empty>
          <div class="empty-state">
            <div class="empty-card">
              <div class="empty-icon">
                <i class="pi pi-stopwatch" />
              </div>
              <h3>Nothing beats a focused timer</h3>
              <p>
                Launch your first countdown and highlight the exact outcome you
                want shoppers to take.
              </p>
              <p class="empty-hint">
                Use the creation control above whenever you are ready.
              </p>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="timer-list">
            <article
              v-for="timer in slotProps.items"
              :key="timer.id"
              class="timer-card"
            >
              <div class="timer-card__header">
                <div>
                  <p class="timer-position">
                    {{ positionLabels[timer.position] ?? timer.position }}
                  </p>
                  <h3>{{ timer.name }}</h3>
                </div>
                <div class="status-chips">
                  <span class="chip chip--type">{{
                    typeLabels[timer.type]
                  }}</span>
                  <span
                    class="chip"
                    :class="
                      timer.status === 'ACTIVE'
                        ? 'chip--success'
                        : 'chip--danger'
                    "
                    >{{ timer.status }}</span
                  >
                  <div class="action-menu">
                    <button
                      class="action-menu__trigger"
                      type="button"
                      @click.stop="toggleActionMenu(timer.id)"
                    >
                      <i class="pi pi-ellipsis-h" />
                    </button>
                    <div
                      v-if="activeMenuId === timer.id"
                      class="action-menu__dropdown"
                      @click.stop
                    >
                      <button
                        type="button"
                        @click="toggleTimerStatus(timer)"
                        :disabled="toggleLoadingId === timer.id"
                      >
                        <i
                          :class="[
                            'pi',
                            toggleLoadingId === timer.id
                              ? 'pi-spin pi-spinner'
                              : timer.status === 'ACTIVE'
                              ? 'pi-pause'
                              : 'pi-play',
                          ]"
                        />
                        {{
                          timer.status === "ACTIVE" ? "Deactivate" : "Activate"
                        }}
                      </button>
                      <button type="button" @click="startEdit(timer.id)">
                        <i class="pi pi-pencil" />
                        Edit timer
                      </button>
                      <button
                        type="button"
                        class="danger"
                        @click="promptDelete(timer)"
                      >
                        <i class="pi pi-trash" />
                        Delete timer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="timer-card__body">
                <div class="timeline" v-if="timer.type === 'FIXED'">
                  <div>
                    <span class="timeline-label">Start</span>
                    <strong>{{ formatDateTime(timer.startAt) }}</strong>
                  </div>
                  <span class="timeline-divider"></span>
                  <div>
                    <span class="timeline-label">End</span>
                    <strong>{{ formatDateTime(timer.endAt) }}</strong>
                  </div>
                </div>
                <div class="timeline" v-else>
                  <div>
                    <span class="timeline-label">Evergreen cadence</span>
                    <strong>{{ evergreenLabel(timer) }}</strong>
                  </div>
                </div>

                <div class="preview-panel">
                  <span>Live preview</span>
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
              </div>
            </article>
          </div>
        </template>
      </DataView>
    </div>
    <div
      v-if="confirmVisible"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Delete countdown timer"
    >
      <div class="modal__backdrop" @click="hideDeleteConfirm"></div>
      <div class="modal__card" @click.stop>
        <div class="modal__icon">
          <i class="pi pi-exclamation-triangle" />
        </div>
        <h3>Remove this timer?</h3>
        <p>
          "{{ confirmTarget ? confirmTarget.name : "this timer" }}" will be
          permanently deleted for all surfaces. This action cannot be undone.
        </p>
        <p v-if="confirmError" class="modal__error">{{ confirmError }}</p>
        <div class="modal__actions">
          <button
            type="button"
            class="ghost"
            @click="hideDeleteConfirm"
            :disabled="deleteLoading"
          >
            Cancel
          </button>
          <button
            type="button"
            class="danger"
            @click="confirmDelete"
            :disabled="deleteLoading"
          >
            <i v-if="deleteLoading" class="pi pi-spin pi-spinner" />
            Delete timer
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="conflictVisible && activationConflict && conflictTarget"
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Switch active timer"
    >
      <div class="modal__backdrop" @click="hideConflictModal"></div>
      <div class="modal__card" @click.stop>
        <div class="modal__icon">
          <i class="pi pi-bolt" />
        </div>
        <h3>Switch active timer?</h3>
        <p>
          There is already an active timer on
          {{
            positionLabels[activationConflict.position] ??
            activationConflict.position
          }}:
          <strong>
            {{ activationConflict.conflictingTimer.name }}
            (ID #{{ activationConflict.conflictingTimer.id }}) </strong
          >.
        </p>
        <p>
          Do you want to deactivate it and activate "{{ conflictTarget.name }}"
          instead?
        </p>
        <div class="modal__actions">
          <button
            type="button"
            class="ghost"
            @click="hideConflictModal"
            :disabled="forceActivateLoading"
          >
            Cancel
          </button>
          <button
            type="button"
            class="primary"
            @click="confirmForceActivate"
            :disabled="forceActivateLoading"
          >
            <i v-if="forceActivateLoading" class="pi pi-spin pi-spinner" />
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
  gap: 1.5rem;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 2rem;
}

.hero-text h1 {
  margin: 0.3rem 0;
  font-size: 2rem;
  color: #0f172a;
}

.hero-text p {
  margin: 0.35rem 0 0;
  color: #475467;
}

.eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7c8aad;
  margin: 0;
}

.hero-actions {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.cta-primary {
  border: none;
  border-radius: 999px;
  padding: 0.65rem 1.35rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  background: linear-gradient(135deg, #fdd835, #f78c6c);
  color: #1f1206;
  box-shadow: 0 18px 40px rgba(247, 140, 108, 0.35);
}

.hero-actions .ghost {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 0.65rem 1rem;
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #0f172a;
}

.hero-actions .ghost {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 0.65rem 1rem;
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: #0f172a;
}

.hero-stats {
  display: grid;
  gap: 0.9rem;
}

.stat-card {
  border-radius: 20px;
  padding: 1.15rem;
  background: linear-gradient(135deg, #fdd835, #f78c6c);
  color: #1a1204;
  border: 1px solid rgba(247, 140, 108, 0.35);
  box-shadow: 0 25px 45px rgba(249, 115, 22, 0.25);
}

.stat-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.65;
}

.stat-card strong {
  display: block;
  font-size: 2rem;
  margin-top: 0.3rem;
}

.stat-card small {
  color: rgba(26, 18, 4, 0.8);
}

.stat-card--loading {
  opacity: 0.65;
}

.stats-error {
  margin-top: 0.25rem;
  color: #b91c1c;
  font-size: 0.85rem;
}

.timers-panel {
  background: #f8fafc;
  border-radius: 28px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.empty-state {
  padding: 2rem 0;
}

.empty-card {
  border-radius: 24px;
  border: 1px dashed rgba(245, 158, 11, 0.5);
  padding: 2rem;
  text-align: center;
  background: linear-gradient(145deg, rgba(253, 216, 53, 0.15), #fff);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.empty-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: #111827;
  color: #f9fafb;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.empty-hint {
  margin: 0;
  font-size: 0.9rem;
  color: #475467;
}

.timer-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timer-card {
  border-radius: 26px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.05);
  background: #ffffff;
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.timer-card__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-start;
}

.timer-card__header h3 {
  margin: 0.2rem 0 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.timer-position {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.status-chips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-menu {
  position: relative;
}

.action-menu__trigger {
  border: none;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #0f172a;
}

.action-menu__dropdown {
  position: absolute;
  top: 42px;
  right: 0;
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.15);
  padding: 0.35rem;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  z-index: 5;
}

.action-menu__dropdown button {
  border: none;
  background: transparent;
  border-radius: 12px;
  padding: 0.4rem 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
}

.action-menu__dropdown button:hover {
  background: rgba(15, 23, 42, 0.05);
}

.action-menu__dropdown button.danger {
  color: #b91c1c;
}

.chip {
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.06);
  color: #0f172a;
}

.chip--type {
  background: rgba(251, 191, 36, 0.25);
  color: #92400e;
}

.chip--success {
  background: rgba(34, 197, 94, 0.18);
  color: #047857;
}

.chip--danger {
  background: rgba(248, 113, 113, 0.18);
  color: #b91c1c;
}

.link {
  background: transparent;
  border: none;
  color: #a16207;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.timer-card__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: center;
}

.timeline {
  border-radius: 20px;
  border: 1px dashed rgba(15, 23, 42, 0.1);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.timeline-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

.timeline strong {
  display: block;
  color: #0f172a;
}

.timeline-divider {
  display: none;
}

.preview-panel {
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.03);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-panel > span {
  font-size: 0.85rem;
  color: #64748b;
}

.preview-bar {
  padding: 0.85rem 1.1rem;
  border-radius: 999px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.preview-bar span {
  color: inherit;
}

.preview-text {
  max-width: 75%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-countdown {
  font-variant-numeric: tabular-nums;
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
  z-index: 20;
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

.modal__error {
  margin: 0;
  color: #b91c1c;
  font-size: 0.9rem;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.modal__actions .ghost {
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  background: transparent;
  font-weight: 600;
  cursor: pointer;
  color: #0f172a;
}

.modal__actions .danger {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.4rem;
  background: #b91c1c;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.modal__actions .primary {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.4rem;
  background: linear-gradient(135deg, #fdd835, #f78c6c);
  color: #1f1206;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 18px 35px rgba(247, 140, 108, 0.35);
}

.modal__actions button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .timer-card__body {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .timers-panel {
    padding: 1rem;
  }

  .timer-card {
    padding: 1.1rem;
  }
}
</style>
