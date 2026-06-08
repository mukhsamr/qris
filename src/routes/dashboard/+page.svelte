<script lang="ts">
	import { Activity, BarChart3, Clock, KeyRound, QrCode, TrendingUp } from "@lucide/svelte/icons";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	const summary = $derived(data.summary ?? []);
	const logs = $derived(data.logs ?? []);
	const chartData = $derived(data.chartData ?? []);

	const iconMap: Record<string, typeof BarChart3> = {
		'bar-chart-3': BarChart3,
		'trending-up': TrendingUp,
		activity: Activity,
		clock: Clock,
	};

	const maxVal = $derived(
		chartData.length > 0
			? Math.max(...chartData.flatMap((d: { api: number; dashboard: number }) => [d.api, d.dashboard]), 1)
			: 1
	);

	function formatRp(n: number) {
		if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`;
		if (n >= 1000) return `${(n / 1000).toFixed(0)}rb`;
		return n.toString();
	}
</script>

<svelte:head>
	<title>Dashboard — QRIS Panel</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h2 class="text-lg font-semibold tracking-[-0.02em]">Dashboard</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Ringkasan penggunaan dan riwayat generate QRIS kamu.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a
				href="/dashboard/qris"
				class="inline-flex h-9 items-center gap-2 border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
			>
				<QrCode class="size-4 text-muted-foreground" />
				QRIS
			</a>
			<a
				href="/dashboard/api-keys"
				class="inline-flex h-9 items-center gap-2 border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
			>
				<KeyRound class="size-4 text-muted-foreground" />
				API Keys
			</a>
		</div>
	</div>

	<div class="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#each summary as stat}
			{@const IconComp = iconMap[stat.icon] ?? BarChart3}
			<div class="flex items-center gap-6 border border-border bg-card px-4 py-4">
				<div class="flex size-9 shrink-0 items-center justify-center border border-border bg-muted">
					<IconComp class="size-4 text-muted-foreground" />
				</div>
				<div class="min-w-0">
					<p class="text-lg font-semibold leading-tight tracking-[-0.02em]">{stat.value}</p>
					<p class="text-xs text-muted-foreground">{stat.label}</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid gap-6 lg:grid-cols-[1fr_380px]">
		<div class="border border-border">
			<div class="border-b border-border bg-muted/50 px-4 py-3">
				<h3 class="text-sm font-semibold">Riwayat Generate</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b border-border text-muted-foreground">
							<th class="px-4 py-2.5 text-xs font-medium">Waktu</th>
							<th class="px-4 py-2.5 text-xs font-medium">Referensi</th>
							<th class="px-4 py-2.5 text-right text-xs font-medium">Nominal</th>
							<th class="px-4 py-2.5 text-xs font-medium">Sumber</th>
						</tr>
					</thead>
					<tbody>
						{#if logs.length > 0}
							{#each logs as log (log.id)}
								<tr class="border-b border-border last:border-b-0">
									<td class="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{log.time}</td>
									<td class="px-4 py-2.5 font-mono text-xs">{log.reference}</td>
									<td class="px-4 py-2.5 text-right font-mono text-xs">Rp {log.amount.toLocaleString("id-ID")}</td>
									<td class="px-4 py-2.5">
										<span class="inline-flex h-5 items-center border border-border px-2 text-[10px] font-medium {log.source === 'API' ? 'border-primary/20 bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">
											{log.source}
										</span>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-sm text-muted-foreground">
									Belum ada riwayat generate.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<div class="border border-border">
			<div class="border-b border-border bg-muted/50 px-4 py-3">
				<h3 class="text-sm font-semibold">7 Hari Terakhir</h3>
			</div>
			<div class="p-4">
				<div class="mb-6 flex items-center gap-4">
					<div class="flex items-center gap-1.5">
						<span class="size-2.5 bg-primary"></span>
						<span class="text-xs text-muted-foreground">API</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="size-2.5 bg-muted-foreground/40"></span>
						<span class="text-xs text-muted-foreground">Dashboard</span>
					</div>
				</div>

				{#if chartData.length > 0}
					<div class="flex h-48 items-end gap-2">
						{#each chartData as d}
							<div class="flex flex-1 flex-col items-center gap-1">
								<span class="text-[10px] leading-none text-muted-foreground">{formatRp(d.api + d.dashboard)}</span>
								<div class="flex w-full flex-1 flex-col-reverse justify-start gap-0.5">
									<div
										class="w-full bg-muted-foreground/40"
										style="height: {(d.dashboard / maxVal) * 100}%"
									></div>
									<div
										class="w-full bg-primary"
										style="height: {(d.api / maxVal) * 100}%"
									></div>
								</div>
								<span class="text-[10px] text-muted-foreground">{d.day}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">
						Belum ada data chart.
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
