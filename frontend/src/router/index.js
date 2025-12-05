import { createRouter, createWebHistory } from "vue-router";
import TimerFormView from "../views/TimerFormView.vue";
import TimersListView from "../views/TimersListView.vue";

const routes = [
  {
    path: "/",
    name: "timers",
    component: TimersListView,
  },
  {
    path: "/timers/new",
    name: "timer-new",
    component: TimerFormView,
  },
  {
    path: "/timers/:id/edit",
    name: "timer-edit",
    component: TimerFormView,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory("/app/"),
  routes,
});

export default router;
