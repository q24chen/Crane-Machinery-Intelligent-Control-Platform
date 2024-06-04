import { defineStore } from "pinia";

export const useUserStatusStore = defineStore("userStatus", {
    state: () => {
        return {
            user: {
                id: "admin",
                password: "tjyqzj",
                isLogin: false,
            },
        };
    },
    getters: {
        getUserStatus(){
            return this.user.isLogin;
        },
    },
    actions: {
        setUserStatus(status) {
            this.user.isLogin = status;
        },
    },
});