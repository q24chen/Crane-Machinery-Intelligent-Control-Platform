<style lang="less" scoped>
.page-404 {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: white;
  span:first-of-type {
    font-size: 11.5rem;
    font-weight: bold;
    text-shadow: 5px 1px 5px rgb(180, 11, 11)
  }
  span:last-of-type {
    font-size: 2rem;
    text-shadow: 5px 1px 5px rgba(0, 0, 0, 1)
  }
  a {
    font-size: 1.25rem;
  }
}
</style>

<template>
  <div class="page-404">
    <span>404</span>
    <span>您访问的页面不存在</span><br>
    <a href="javascript:void(0)" @click="$router.push('/login')">返回首页</a>
  </div>
</template>

<script>
</script>
