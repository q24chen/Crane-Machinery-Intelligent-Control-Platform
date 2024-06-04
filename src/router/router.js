import { createRouter, createWebHashHistory } from "vue-router";

import loginView from "../components/login.vue";
import mainView from "../components/mainSence.vue";
import errorView from "../components/404.vue";

import {useUserStatusStore} from "../stores/userStatus";

const routes = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: "/login",
        component: loginView,
    },
    {
        path: "/home",
        component: mainView,
        meta: { requiresAuth: true } // 添加此元信息
    },
    {
        path: "/:catchAll(.*)",// 添加重定向规则，使得任何未匹配到的路径都重定向到404页
        component: errorView,
    },
]
const router = createRouter({
    history: createWebHashHistory(),
    routes,
})



// router.beforeEach((to, from, next) => {
//     const userStatus=useUserStatusStore();
//     console.log(userStatus.getUserStatus);
//     if (to.matched.some(record => record.meta.requiresAuth)) {
//         // 这里检查用户是否已登录
//         if (!userStatus.getUserStatus) {
//             next('/login') // 未登录，重定向到登录页面
//         } else {
//             next() // 已登录，继续导航
//         }
//     } else {
//           next() // 其他路由
//     }
// })


export default router