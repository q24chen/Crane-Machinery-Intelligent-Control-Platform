<template>
    <!-- <div class="container"> -->
        <div class="block1">
            <div class="title">设备信息</div>
            <el-table :data="craneData" border style="width: 100%; background: transparent;" :show-header="true">
                <el-table-column class = "type1" prop="type" label="类型" />
                <el-table-column prop="content" label="内容" />
            </el-table>
        </div>
        <div class="block2"></div>
        <div class="line"></div>
    <!-- </div> -->
</template>

<script setup>
import { ref } from 'vue';

const craneData = ref([
    {
        type: '设备名：',
        content: '门式起重机',
    },
    {
        type: '型号：',
        content: 'DB-MSQZJ-78Tga',
    },
    {
        type: '设备编号：',
        content: 'TJY-18239',
    },
    {
        type: '最大起重量(吨)：',
        content: '78.0',
    },
]);
</script>

<style scoped>
.container {
    position: relative;
    width: 300px;
    height: 500px;
    margin: 50px auto;
    /* background-color: rgb(232, 14, 90); */
}

.block1 {
    width: 255px;
    height: fit-content;
    position: absolute;
    top: 5px;
    left: 100px;
    background-image: url('../assets/blank.png');
    background-size: 100% 100%;
    padding: 10px; /* 添加内边距，避免内容紧贴边缘 */
    padding-top: 20px;
    padding-bottom: 20px;
}

.title {
    text-align: center;
    font-weight: bold;
    margin-bottom: 10px; 
    background-color: rgba(255, 255, 255, 0.9); /* 透明背景色 */
}

.block2 {
    top: 435px;
    left: 38px;
    background-image: url('../assets/infopoint2.png');
    background-size: 100% 100%;
    width: 20px;
    height: 20px;
    position: absolute;
    opacity: 0.8;
}


.line {
   position: absolute;
    top: 436px;
    left: 55px;
    width: 226px;
    height: 2px;
    background-color: rgb(17, 120, 230);
    transform: rotate(315deg);
    transform-origin: top left;
    opacity: 0.6;
}


</style>
