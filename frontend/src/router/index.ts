import { createRouter, createWebHistory } from "vue-router";
import App from "../App.vue";
import HopDongPublic from "../components/hop-dong/HopDongPublic.vue";
import UserAdmin from "../components/tai-khoan/UserAdmin.vue";

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: "/",
      component: App,
    },
    {
      path: "/hopdong",
      component: HopDongPublic,
    },
    {
      path: "/user",
      component: UserAdmin,
    },
  ],
});

export default router;
