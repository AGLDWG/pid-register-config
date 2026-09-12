<script lang="ts" setup>
const route = useRoute();
</script>

<template>
    <!-- Refresh the resource when client-side navigation changes the IRI or profile. -->
    <ItemPageWrapper :key="route.fullPath" />
</template>
