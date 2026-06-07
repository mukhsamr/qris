<script lang="ts">
  import CircleAlert from "@lucide/svelte/icons/circle-alert";
  import CircleCheck from "@lucide/svelte/icons/circle-check";
  import Info from "@lucide/svelte/icons/info";

  interface Props {
    variant?: "error" | "success" | "info";
    message: string;
  }

  let { variant = "error", message }: Props = $props();

  const styles: Record<string, { border: string; bg: string; icon: string; text: string }> = {
    error: {
      border: "border-red-200",
      bg: "bg-red-50",
      icon: "text-red-500",
      text: "text-red-700",
    },
    success: {
      border: "border-green-200",
      bg: "bg-green-50",
      icon: "text-green-500",
      text: "text-green-700",
    },
    info: {
      border: "border-blue-200",
      bg: "bg-blue-50",
      icon: "text-blue-500",
      text: "text-blue-700",
    },
  };

  const s = $derived(styles[variant]);

  const IconComponent = $derived(
    variant === "error"
      ? CircleAlert
      : variant === "success"
        ? CircleCheck
        : Info
  );
</script>

<div class={["flex items-start gap-2.5 rounded-md border px-4 py-3", s.border, s.bg].join(" ")}>
  <IconComponent class={["mt-0.5 size-4 shrink-0", s.icon].join(" ")} strokeWidth={2} />
  <p class={["text-[13px] font-medium", s.text].join(" ")}>{message}</p>
</div>
