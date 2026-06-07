<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<div
  class="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6 mt-8"
>
  {#if children}
    {@render children()}
  {/if}
</div>
