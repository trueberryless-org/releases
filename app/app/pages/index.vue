<script setup lang="ts">
import { formatTimeAgo } from "@vueuse/core";
import type { ReturnData } from "~~/server/api/releases";

const isDark = useDark();

const { data } = await useFetch<ReturnData>("/api/releases");

const config = useRuntimeConfig();

const DEDUPE_RANGE = 2;

const list = computed(() => {
  const items = data.value?.infos || [];
  return items.filter((item, idx) => {
    const previous = items.slice(Math.max(0, idx - DEDUPE_RANGE), idx);
    if (previous.some((p) => p.repo === item.repo)) return false;
    return true;
  });
});
</script>

<template>
  <div flex="~ col gap-8" mxa max-w-180 p10 font-sans lt-sm="px6">
    <div flex="~ col gap-4">
      <h1 flex="~ gap-2 col justify-center items-center">
        <a :href="`https://github.com/${config.public.name}`" target="_blank">
          <img
            :src="`https://github.com/${config.public.name}.png`"
            :alt="`${config.public.name}`"
            mr1
            h-18
            w-18
            rounded-full
            shadow
          />
        </a>
        <div flex="~ col">
          <div text-3xl>
            <a
              :href="`https://github.com/${config.public.name}`"
              target="_blank"
            >
              {{ config.public.name }}
            </a>
            is <span animate-pulse>Releasing...</span>
          </div>
          <p flex items-center justify-center gap-2 op50>
            <a
              :href="`https://github.com/${config.public.login}`"
              target="_blank"
            >
              <span font-mono>@{{ config.public.login }}</span
              >'s profile on GitHub
            </a>
          </p>
        </div>
      </h1>

      <div flex items-center justify-center gap-3 text-lg>
        <button title="Toggle Dark Mode" @click="isDark = !isDark">
          <span i-ph-sun-duotone dark:i-ph-moon-stars-duotone flex />
        </button>
        <a
          href="https://github.com/trueberryless-org/releases"
          target="_blank"
          title="GitHub Source Code"
        >
          <span i-ph-github-logo-duotone flex />
        </a>
        <a href="/feed.xml" target="_blank" title="RSS Feed">
          <span i-ph-rss-simple-duotone flex />
        </a>
      </div>

      <div p2>
        <hr ma w-20 op25 />
      </div>
    </div>

    <TheItem
      v-for="(item, idx) of list"
      :key="item.id"
      :item="item"
      :prev="list[idx - 1]"
    />

    <div p2 pt8>
      <hr ma w-20 op25 />
    </div>
    <div text-center op50>
      <div v-if="data?.lastUpdated" flex="~ gap-1 wrap justify-center">
        <span op75>Last activity:</span>
        <time :datetime="new Date(data.lastUpdated).toString()">{{
          formatTimeAgo(new Date(data.lastUpdated))
        }}</time>
        <span mx2 op50>|</span>
        <span op75>Last fetched:</span>
        <time :datetime="new Date(data.lastFetched).toString()">{{
          formatTimeAgo(new Date(data.lastFetched))
        }}</time>
      </div>
      <span op75>
        GitHub API is not always realtime, it might take a couple hours to
        update.
      </span>
    </div>
    <div p2>
      <hr ma w-20 op25 />
    </div>
    <div text-center op50>
      <a href="https://github.com/antfu/releases.antfu.me"
        >Create your own page for latest releases</a
      >
    </div>
  </div>
</template>
