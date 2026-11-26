<script setup lang="ts">
import BaseItemProfiles from 'prez-ui/app/components/ItemProfiles.vue';
import { isAnnotatedFormat } from '../utils/profileFormats';

defineOptions({ inheritAttrs: false });
interface Profile {
    mediatypes: { mediatype: string; [key: string]: unknown }[];
    [key: string]: unknown;
}
const props = defineProps<{ profiles?: Profile[] }>();
const publicProfiles = computed(() => props.profiles?.map(profile => ({
    ...profile,
    mediatypes: profile.mediatypes.filter(format => !isAnnotatedFormat(format.mediatype)),
})));
</script>

<template>
    <BaseItemProfiles v-bind="$attrs" :profiles="publicProfiles" />
</template>
