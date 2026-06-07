<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Component } from "svelte";
  import Upload from "@lucide/svelte/icons/upload";
  import CircleCheck from "@lucide/svelte/icons/circle-check";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";

  interface Props {
    accept?: string;
    label?: string;
    hint?: string;
    preview?: string | null;
    previewAlt?: string;
    decoding?: boolean;
    decoded?: boolean;
    decodeError?: boolean;
    successMessage?: string;
    successSubMessage?: string;
    loadingMessage?: string;
    loadingSubMessage?: string;
    errorMessage?: string;
    errorSubMessage?: string;
    placeholderIcon?: Component<{ class?: string; strokeWidth?: number }>;
    placeholderText?: string;
    placeholderHint?: string;
    onchange?: (e: Event) => void;
    inputRef?: HTMLInputElement | null;
  }

  let {
    accept = "image/*",
    label,
    hint = "PNG atau JPG",
    preview = null,
    previewAlt = "Preview QRIS",
    decoding = false,
    decoded = false,
    decodeError = false,
    successMessage = "Payload berhasil dibaca",
    successSubMessage = "Klik untuk mengganti gambar",
    loadingMessage = "Membaca QRIS...",
    loadingSubMessage = "Decoding",
    errorMessage = "QR tidak terdeteksi",
    errorSubMessage = "Klik untuk mengganti gambar",
    placeholderIcon: Icon = Upload,
    placeholderText = "Upload gambar QRIS",
    placeholderHint = hint,
    onchange,
    inputRef = $bindable(null),
  }: Props = $props();
</script>

<div>
  {#if label}
    <label
      for="file-upload"
      class="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-soft"
    >
      {label}
    </label>
  {/if}
  <label
    class="relative block cursor-pointer overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-border-strong"
  >
    {#if preview}
      <div class="flex items-center gap-4 p-4">
        <div
          class="grid size-[52px] shrink-0 place-items-center rounded-md border border-border bg-card p-1"
        >
          <img
            src={preview}
            alt={previewAlt}
            class="size-full object-contain"
          />
        </div>
        <div class="min-w-0 flex-1">
          {#if decoding}
            <p class="text-[0.875rem] font-medium text-ink">
              {loadingMessage}
            </p>
            <p class="mt-0.5 text-[0.75rem] text-muted-soft">
              {loadingSubMessage}
            </p>
          {:else if decoded}
            <p class="text-[0.875rem] font-medium text-accent-strong">
              {successMessage}
            </p>
            <p class="mt-0.5 text-[0.75rem] text-muted-soft">
              {successSubMessage}
            </p>
          {:else if decodeError}
            <p class="text-[0.875rem] font-medium text-red-600">
              {errorMessage}
            </p>
            <p class="mt-0.5 text-[0.75rem] text-muted-soft">
              {errorSubMessage}
            </p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center gap-2 py-7">
        <Icon class="size-5 text-muted-soft" strokeWidth={1.75} />
        <p class="text-[0.875rem] font-medium text-ink">
          {placeholderText}
        </p>
        <p class="text-[0.75rem] text-muted-soft">{placeholderHint}</p>
      </div>
    {/if}
    <input
      id="file-upload"
      bind:this={inputRef}
      type="file"
      {accept}
      {onchange}
      class="absolute inset-0 cursor-pointer opacity-0"
    />
  </label>
</div>
