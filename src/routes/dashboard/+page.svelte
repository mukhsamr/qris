<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import QrCode from "@lucide/svelte/icons/qr-code";
	import BarChart3 from "@lucide/svelte/icons/bar-chart-3";
	import KeyRound from "@lucide/svelte/icons/key-round";
	import ArrowRight from "@lucide/svelte/icons/arrow-right";
</script>

<svelte:head>
	<title>Dashboard — QRIS Panel</title>
</svelte:head>

<div class="max-w-5xl">
	<!-- Welcome -->
	<div class="mb-6">
		<h2 class="text-lg font-semibold tracking-[-0.02em]">Selamat datang kembali 👋</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Kelola QRIS dan API keys kamu dari sini.
		</p>
	</div>

	<!-- Shortcuts -->
	<div class="grid gap-6 sm:grid-cols-3">
		<a
			href="/dashboard/qris"
			class="flex items-center gap-4 border border-border bg-card px-5 py-4 transition-colors hover:bg-muted"
		>
			<div class="flex size-9 shrink-0 items-center justify-center border border-border bg-muted">
				<QrCode class="size-4 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium">QRIS</p>
				<p class="text-xs text-muted-foreground">Kelola QRIS statis kamu</p>
			</div>
			<ArrowRight class="size-4 shrink-0 text-muted-foreground" />
		</a>

		<a
			href="/dashboard/stats"
			class="flex items-center gap-4 border border-border bg-card px-5 py-4 transition-colors hover:bg-muted"
		>
			<div class="flex size-9 shrink-0 items-center justify-center border border-border bg-muted">
				<BarChart3 class="size-4 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium">Stats</p>
				<p class="text-xs text-muted-foreground">Riwayat & grafik generate</p>
			</div>
			<ArrowRight class="size-4 shrink-0 text-muted-foreground" />
		</a>

		<a
			href="/dashboard/api-keys"
			class="flex items-center gap-4 border border-border bg-card px-5 py-4 transition-colors hover:bg-muted"
		>
			<div class="flex size-9 shrink-0 items-center justify-center border border-border bg-muted">
				<KeyRound class="size-4 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium">API Keys</p>
				<p class="text-xs text-muted-foreground">Buat dan kelola API key</p>
			</div>
			<ArrowRight class="size-4 shrink-0 text-muted-foreground" />
		</a>
	</div>
</div>
