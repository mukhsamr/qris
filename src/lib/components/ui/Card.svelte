<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    padding?: "sm" | "md" | "lg";
    children: Snippet;
  }

  let { padding = "lg", children }: Props = $props();
</script>

<div
  class="rounded-lg border border-border bg-card shadow-card {padding === 'sm'
    ? 'p-4'
    : padding === 'md'
      ? 'p-6'
      : 'p-6 lg:p-8'}"
>
  {@render children()}
</div>
