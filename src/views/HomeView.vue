<script setup lang="ts" name="HomeView">
</script>

<style scoped>
.navigate {
    display: flex;
    justify-content: flex-start;
    background-color: rgba(0, 0, 0, 0.265);
    color:blue;
    padding: 10px;
    margin: 0;
}
.link{
margin-right: 20px;
}
.active{
    color:red;
}
</style>

<template>
    <div class="navigate">
        <RouterLink to="/det" active-class="active" class="link">检测</RouterLink>
        <RouterLink to="/cls" active-class="active">分类</RouterLink>
    </div>
    <router-view />
</template>