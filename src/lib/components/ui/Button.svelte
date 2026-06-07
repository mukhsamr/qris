<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Component } from "svelte";
  import LoaderCircle from "@lucide/svelte/icons/loader-circle";

  interface Props {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    buttonType?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    href?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
    icon?: Component<{ class?: string; strokeWidth?: number }>;
  }

  let {
    variant = "primary",
    size = "md",
    buttonType = "button",
    disabled = false,
    loading = false,
    fullWidth = false,
    href,
    onclick,
    children,
    icon: Icon,
  }: Props = $props();

  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-[13px]",
    md: "px-5 py-2.5 text-[0.875rem]",
    lg: "px-6 py-3 text-[1rem]",
  };

  let rootClass = $derived(
    [
      "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition",
      fullWidth && "w-full",
      sizeClasses[size],
      variant === "primary" &&
        "bg-accent text-card shadow-card hover:bg-accent-strong hover:-translate-y-px",
      variant === "secondary" &&
        "bg-surface-soft text-ink hover:bg-surface hover:text-ink shadow-sm",
      variant === "ghost" && "text-muted hover:bg-surface-soft hover:text-ink",
      (disabled || loading) &&
        "cursor-not-allowed bg-border text-muted-soft shadow-none hover:translate-y-0",
      loading && "cursor-wait",
    ]
      .filter(Boolean)
      .join(" "),
  );

  const isDisabled = $derived(disabled || loading);
</script>

{#if href}
  <a
    {href}
    class={rootClass}
  >
    {#if loading}
      <LoaderCircle class="size-4 animate-spin" strokeWidth={2.25} />
    {:else if Icon}
      <Icon class="size-4" strokeWidth={2.25} />
    {/if}
    {@render children()}
  </a>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <button
    type={buttonType}
    disabled={isDisabled}
    {onclick}
    class={rootClass}
  >
    {#if loading}
      <LoaderCircle class="size-4 animate-spin" strokeWidth={2.25} />
    {:else if Icon}
      <Icon class="size-4" strokeWidth={2.25} />
    {/if}
    {@render children()}
  </button>
{/if}
