<script lang="ts">
  import type { Snippet } from "svelte";
  import Upload from "@lucide/svelte/icons/upload";
  import LoaderCircle from "@lucide/svelte/icons/loader-circle";
  import CircleCheck from "@lucide/svelte/icons/circle-check";
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import { Label } from "$lib/components/ui/label";

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
    placeholderText = "Pilih atau letakkan gambar QRIS",
    placeholderHint = hint,
    onchange,
    inputRef = $bindable(null),
  }: Props = $props();
</script>

<div class="space-y-1.5">
  {#if label}
    <Label for="file-upload">{label}</Label>
  {/if}
  <label
    for="file-upload"
    class="relative block cursor-pointer overflow-hidden rounded-2xl border border-input bg-input/50 transition-[color,box-shadow] hover:border-ring/30 focus-within:ring-3 focus-within:ring-ring/30 focus-within:border-ring"
  >
    {#if preview}
      <div class="flex items-center gap-4 p-4">
        <div
          class="grid size-13 shrink-0 place-items-center rounded-lg border border-border bg-card p-1"
        >
          <img
            src={preview}
            alt={previewAlt}
            class="size-full object-contain"
          />
        </div>
        <div class="min-w-0 flex-1">
          {#if decoding}
            <p class="text-sm font-medium text-foreground">
              {loadingMessage}
              <LoaderCircle
                class="ml-2 inline-block size-3.5 animate-spin text-muted-foreground"
              />
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {loadingSubMessage}
            </p>
          {:else if decoded}
            <p class="text-sm font-medium text-primary">
              {successMessage}
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {successSubMessage}
            </p>
          {:else if decodeError}
            <p class="text-sm font-medium text-destructive">
              {errorMessage}
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {errorSubMessage}
            </p>
          {:else}
            <p class="text-sm font-medium text-foreground">Preview</p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="flex flex-col items-center gap-2 py-7">
        <Upload
          class="size-5 text-muted-foreground"
          strokeWidth={1.75}
        />
        <p class="text-sm font-medium text-foreground">
          {placeholderText}
        </p>
        <p class="text-xs text-muted-foreground">{placeholderHint}</p>
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
