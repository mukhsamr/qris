<script lang="ts">
	import * as Separator from "$lib/components/ui/separator/index.js";
	import { BarChart3, TrendingUp, Activity, Clock } from "@lucide/svelte/icons";

	let { data } = $props();

	const summary = data.summary ?? [];
	const logs = data.logs ?? [];
	const chartData = data.chartData ?? [];

	const iconMap: Record<string, typeof BarChart3> = {
		'bar-chart-3': BarChart3,
		'trending-up': TrendingUp,
		activity: Activity,
		clock: Clock,
	};

	const maxVal = chartData.length > 0
		? Math.max(...chartData.flatMap((d: { api: number; dashboard: number }) => [d.api, d.dashboard]), 1)
		: 1;

	function formatRp(n: number) {
		if (n >= 1000000) return `${(n / 1000000).toFixed(1)}jt`;
		if (n >= 1000) return `${(n / 1000).toFixed(0)}rb`;
		return n.toString();
	}
</script>

<svelte:head>
	<title>Stats — QRIS Panel</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="mb-6">
		<h2 class="text-lg font-semibold tracking-[-0.02em]">Statistik</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Ringkasan penggunaan dan riwayat generate QRIS kamu.
		</p>
	</div>

	<!-- Summary -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
		{#each summary as stat}
			{@const IconComp = iconMap[stat.icon] ?? BarChart3}
			<div class="border border-border bg-card px-4 py-4 flex items-center gap-6">
				<div class="flex size-9 shrink-0 items-center justify-center border border-border bg-muted">
					<IconComp class="size-4 text-muted-foreground" />
				</div>
				<div class="min-w-0">
					<p class="text-lg font-semibold tracking-[-0.02em] leading-tight">{stat.value}</p>
					<p class="text-xs text-muted-foreground">{stat.label}</p>
				</div>
			</div>
		{/each}
	</div>

	<div class="grid gap-6 lg:grid-cols-[1fr_380px]">
		<!-- Log table -->
		<div class="border border-border">
			<div class="px-4 py-3 border-b border-border bg-muted/50">
				<h3 class="text-sm font-semibold">Riwayat Generate</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b border-border text-muted-foreground">
							<th class="px-4 py-2.5 font-medium text-xs">Waktu</th>
							<th class="px-4 py-2.5 font-medium text-xs">Referensi</th>
							<th class="px-4 py-2.5 font-medium text-xs text-right">Nominal</th>
							<th class="px-4 py-2.5 font-medium text-xs">Sumber</th>
						</tr>
					</thead>
					<tbody>
						{#if logs.length > 0}
							{#each logs as log (log.id)}
								<tr class="border-b border-border last:border-b-0">
									<td class="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{log.time}</td>
									<td class="px-4 py-2.5 font-mono text-xs">{log.reference}</td>
									<td class="px-4 py-2.5 text-right font-mono text-xs">Rp {log.amount.toLocaleString("id-ID")}</td>
									<td class="px-4 py-2.5">
										<span class="inline-flex items-center h-5 px-2 text-[10px] font-medium border border-border {log.source === 'API' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}">
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

		<!-- Chart -->
		<div class="border border-border">
			<div class="px-4 py-3 border-b border-border bg-muted/50">
				<h3 class="text-sm font-semibold">7 Hari Terakhir</h3>
			</div>
			<div class="p-4">
				<div class="flex items-center gap-4 mb-6">
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
					<div class="flex items-end gap-2 h-48">
						{#each chartData as d}
							<div class="flex-1 flex flex-col items-center gap-1">
								<span class="text-[10px] text-muted-foreground leading-none">{formatRp(d.api + d.dashboard)}</span>
								<div class="w-full flex flex-col-reverse gap-0.5 flex-1 justify-start">
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
					<div class="flex items-center justify-center h-48 text-sm text-muted-foreground">
						Belum ada data chart.
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
