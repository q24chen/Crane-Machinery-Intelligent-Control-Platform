<template>
    <img id="img" :src="background" alt="">
    <div id="login">
        <div id="title">登录</div>
        <div class="input">
            <el-input v-model="userId" placeholder="请输入用户名" clearable prefix-icon="User" />
        </div>
        <el-button type="primary" @click="login">继续</el-button>
        <div v-if="showAlert" style="max-width: 600px">
            <el-alert :title="alertTitle" type="error" effect="dark" center :closable="false"/>
            <div class="close-button">
                <el-button @click="closeAlert" size="small" icon="CircleClose"></el-button>
            </div>
        </div>
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
const showAlert = ref(false);
const alertTitle = ref('');

function closeAlert() {
    showAlert.value = false;
}

function login() {

    const userStatus = useUserStatusStore();
    if (userId.value == '') {
        alertTitle.value = "请输入账号";
        showAlert.value = true;
    } else {
        if (userId.value === userStatus.user.id) {
            userStatus.setUserStatus(true);
            router.push('/login');
        }
        else {
            alertTitle.value = "用户不存在";
            showAlert.value = true;
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

    .close-button {
        position: absolute;
        top: 220px;
        right: 350px;
        // background-color: rgb(213, 111, 131);
    }

    #close {
        z-index: 5;
    }

    .el-alert:first-child {
        margin: 0;
    }
}
</style>