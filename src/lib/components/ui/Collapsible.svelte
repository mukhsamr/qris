<script lang="ts">
  import type { Snippet, Component } from "svelte";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";

  interface Props {
    summary: Snippet;
    children: Snippet;
  }

  let { summary, children }: Props = $props();
</script>

<details class="group mt-5">
  <summary
    class="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden"
  >
    <ChevronRight
      class="size-3.5 shrink-0 transition-transform group-open:rotate-90"
      strokeWidth={2.25}
    />
    {@render summary()}
  </summary>
  <div class="mt-3">
    {@render children()}
  </div>
</details>
