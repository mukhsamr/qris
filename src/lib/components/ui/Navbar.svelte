<script lang="ts">
  import type { Component, Snippet } from "svelte";
  import QrCode from "@lucide/svelte/icons/qr-code";
  import Button from "./Button.svelte";

  interface Props {
    href?: string;
    logoIcon?: Component<{ class?: string; strokeWidth?: number }>;
    brandName?: string;
    children?: Snippet;
  }

  let {
    href = "/",
    logoIcon: Icon = QrCode,
    brandName = "QRIS Converter",
    children,
  }: Props = $props();
</script>

<nav class="shrink-0 border-b border-border">
  <div
    class="mx-auto flex h-13 max-w-6xl items-center justify-between px-6 lg:px-8"
  >
    <a
      {href}
      class="flex items-center gap-2.5"
    >
      <div class="flex size-8 items-center justify-center rounded-lg bg-accent">
        <Icon
          class="size-4 text-card"
          strokeWidth={2.25}
        />
      </div>
      <span class="text-[15px] font-semibold tracking-[-0.02em] text-ink">
        {brandName}
      </span>
    </a>

    {#if children}
      <div class="flex items-center gap-3">
        {@render children()}
      </div>
    {/if}
  </div>
</nav>
