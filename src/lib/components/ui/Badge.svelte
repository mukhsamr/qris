<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Component } from "svelte";

  interface Props {
    icon?: Component<{ class?: string; strokeWidth?: number }>;
    label: string;
    children?: Snippet;
  }

  let { icon: Icon, label, children }: Props = $props();
</script>

<div class="flex items-center gap-2">
  {#if Icon}
    <Icon class="size-4 shrink-0 text-accent" strokeWidth={2.25} />
  {/if}
  <span class="text-[13px] font-medium text-muted">{label}</span>
  {#if children}
    {@render children()}
  {/if}
</div>
