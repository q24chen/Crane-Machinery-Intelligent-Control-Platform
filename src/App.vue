<script setup>
import login from './components/login.vue';
import mainSence from './components/mainSence.vue';
import mainSenceV06 from './components/mainSenceV0.6.vue';
</script>

<template>
    <div class="app">
        <!-- <login/> -->
        <!-- <mainSence /> -->
        <router-view></router-view>
    </div>

</template>

<style scoped>
.app{
    width: 100%;
    height: 100%;
}
</style>
