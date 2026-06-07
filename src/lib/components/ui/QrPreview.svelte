<script lang="ts">
  import QrCode from "@lucide/svelte/icons/qr-code";

  interface Props {
    src?: string | null;
    alt?: string;
    size?: "sm" | "md" | "lg";
  }

  let { src = null, alt = "QR Code", size = "md" }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: "size-20",
    md: "size-28 lg:size-32",
    lg: "size-36 lg:size-44",
  };
</script>

<div
  class={[
    "grid shrink-0 place-items-center rounded-md border border-border bg-white p-2 shadow-card",
    sizeClasses[size],
  ].join(" ")}
>
  {#if src}
    <img {src} {alt} class="size-full object-contain" />
  {:else}
    <QrCode class="size-14 text-muted-soft" strokeWidth={1.25} />
  {/if}
</div>
