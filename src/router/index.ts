import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      children: [
        {
          path: "/det",
          name: "det",

          component: () => import("../views/LabelDet.vue"),
        },

        {
          path: "/cls",
          name: "cls",

          component: () => import("../views/LabelCls.vue"),
        },
      ],
    },
  ],
});

export default router
