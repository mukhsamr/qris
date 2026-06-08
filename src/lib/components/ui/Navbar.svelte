<script lang="ts">
  import logo from "$lib/assets/logo.jpg";
  import { Button } from "$lib/components/ui/button/index.js";

  interface Props {
    href?: string;
    brandName?: string;
  }

  let {
    href = "/",
    brandName = "QRIS Converter",
  }: Props = $props();
</script>

<nav class="sticky top-0 z-50 shrink-0 border-b border-border bg-background">
  <div
    class="mx-auto flex h-13 max-w-6xl items-center justify-between px-6 lg:px-8"
  >
    <a {href} class="flex items-center gap-2.5">
      <img src={logo} alt="{brandName} logo" class="size-7 object-contain" />
      <span class="text-sm font-semibold tracking-[-0.02em] text-foreground">
        {brandName}
      </span>
    </a>

    <div class="flex items-center gap-2">
      <Button variant="ghost" size="sm" href="/login">Masuk</Button>
      <Button size="sm" href="/register">Daftar</Button>
    </div>
  </div>
</nav>
