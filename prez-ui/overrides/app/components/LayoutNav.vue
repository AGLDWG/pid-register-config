<script lang="ts" setup>
import { Cog } from "lucide-vue-next";

const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const showDebugPanel = defineModel<boolean>();

const menu = [
    { label: "Home", url: "/" },
    { label: "Registers", url: "/catalogues" },
    { label: "Search", url: "/search" },
    { label: "SPARQL", url: "/sparql" },
    { label: "About", url: "/about" },
    { label: "API Documentation", url: "/docs" },
];
</script>

<template>
    <div class="border-b relative">
        <nav class="main-nav container font-extralight mx-auto px-4 py-4 hidden md:flex md:flex-row gap-8 text-lg">
            <NuxtLink
                v-for="{ label, url } in menu"
                :key="url"
                :to="url"
                :class="`border-b-[3px] hover:border-primary transition-all ${(url === '/' && route.path === '/') || (url !== '/' && route.path.startsWith(url)) ? 'text-primary border-primary' : 'border-transparent'}`"
            >{{ label }}</NuxtLink>

            <div v-if="runtimeConfig.public.prezDebug" class="!ml-auto">
                <span
                    :title="showDebugPanel ? 'Toggle debug off' : 'Toggle debug on'"
                    class="hover:cursor-pointer hover:text-gray-500 text-gray-300"
                    @click="showDebugPanel = !showDebugPanel"
                >
                    <Cog class="w-4 h-4" />
                </span>
            </div>
        </nav>
    </div>
</template>
