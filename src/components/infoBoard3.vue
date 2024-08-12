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
    { type: '设备名', content: '单臂式起重机' },
    { type: '型号', content: 'DB-QZJ-34Dfa' },
    { type: '设备编号', content: 'TJY-24426' },
    { type: '最大起重量(吨)', content: '34.0' }
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
    top: 600px;
    left: -220px;
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
    top: 456px;
    left: 45px;
    width: 205px;
    height: 2px;
    background-color: rgb(17, 120, 230);
    transform: rotate(135deg);
    transform-origin: top left;
    opacity: 0.6;
}

.el-table,
.el-table th,
.el-table td {
    background-color: transparent !important;
}

</style>
