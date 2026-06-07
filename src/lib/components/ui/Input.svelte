<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    id?: string;
    label?: string;
    placeholder?: string;
    type?: "text" | "number" | "email" | "password";
    value?: string;
    min?: number;
    max?: number;
    disabled?: boolean;
    readonly?: boolean;
    onchange?: (e: Event) => void;
    oninput?: (e: Event) => void;
    prefix?: Snippet;
  }

  let {
    id,
    label,
    placeholder = "",
    type = "text",
    value = $bindable(""),
    min,
    max,
    disabled = false,
    readonly = false,
    onchange,
    oninput,
    prefix,
  }: Props = $props();

  const inputId = $derived(
    id ?? label?.toLowerCase().replace(/\s+/g, "-") ?? undefined
  );
</script>

{#if label}
  <label
    for={inputId}
    class="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-muted-soft"
  >
    {label}
  </label>
{/if}

<div
  class="flex overflow-hidden rounded-md border border-border bg-surface shadow-sm transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
>
  {#if prefix}
    <span
      class="grid w-[46px] shrink-0 place-items-center border-r border-border text-[13px] font-semibold text-muted"
    >
      {@render prefix()}
    </span>
  {/if}
  <input
    {id}
    name={inputId}
    {type}
    bind:value
    {placeholder}
    {min}
    {max}
    {disabled}
    {readonly}
    {onchange}
    {oninput}
    class="min-w-0 flex-1 border-0 bg-transparent px-[14px] py-[10px] text-[0.875rem] font-medium text-ink placeholder:text-muted-soft/60 focus:outline-none focus:ring-0"
  />
</div>
