<template>
    <img id="img" :src="background" alt="">
    <div id="login">
        <div id="title">起重机系统</div>
        <div class="input">
            <el-input v-model="userId" placeholder="请输入用户名" clearable prefix-icon="User" />
        </div>
        <div class="input">
            <el-input v-model="password" placeholder="请输入密码" type="password" clearable prefix-icon="Lock" show-password />
        </div>
        <el-button type="primary" @click="login">登录</el-button>
    </div>
</template>
<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'

import { useUserStatusStore } from "../stores/userStatus";

import background from '../assets/loginBackground.jpg'

const route = useRoute();
const router = useRouter();

const userId = ref('');
const password = ref('');

function login() {
    console.log(userId.value, password.value);

    const userStatus = useUserStatusStore();

    console.log( userStatus.user);
    if (userId.value == '' || password.value == '') {
        ElMessage({
            showClose: true,
            message: '请输入用户名或密码',
            type: 'warning',
        })
    } else {
        if (userId.value === userStatus.user.id && password.value === userStatus.user.password) {
            userStatus.setUserStatus(true);
            router.push('/home');
        }
        else {
            ElMessage({
                showClose: true,
                message: '用户名或密码错误',
                type: 'error',
            })
        }
    }

}

</script>
<style scoped lang="less">
#img {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
}

#login {
    position: absolute;
    width: 400px;
    height: 450px;
    left: 60%;
    top: 20%;
    border: 4px solid rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    background-color: rgba(238, 232, 232, 0.1);

    #title {
        width: fit-content;
        margin: 40px auto;
        font-size: 26px;
    }

    .input {
        margin: 20px auto;
        width: 70%;
        height: 40px;
        display: flex;
        align-items: center;

        .el-input {
            height: 40px;

            .el-icon {
                width: 80%;
                height: 80%;
            }
        }
    }

    .el-button {
        display: flex;
        margin: 20px auto;
        width: 70%;
    }
}
</style>