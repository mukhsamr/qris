<script lang="ts">
  import QrCode from "@lucide/svelte/icons/qr-code";

  interface Props {
    src?: string | null;
    alt?: string;
    size?: "sm" | "md" | "lg" | "xl";
  }

  let { src = null, alt = "QR Code", size = "md" }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: "size-20",
    md: "size-28 lg:size-32",
    lg: "size-40 lg:size-48",
    xl: "size-52 lg:size-60",
  };
</script>

<div
  class={[
    "grid shrink-0 place-items-center rounded-lg border border-border bg-white p-2 shadow-sm",
    sizeClasses[size],
  ].join(" ")}
>
  {#if src}
    <img {src} {alt} class="size-full object-contain" />
  {:else}
    <QrCode class="size-14 text-muted-foreground/40" strokeWidth={1.25} />
  {/if}
</div>
