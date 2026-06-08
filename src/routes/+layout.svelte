<script lang="ts">
	import { navigating } from '$app/state';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
	let isNavigating = $derived(Boolean(navigating.to));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if isNavigating}
	<div
		class="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary/10"
		role="status"
		aria-label="Memuat halaman"
	>
		<div class="page-loader-indicator h-full w-1/3 bg-primary"></div>
	</div>
{/if}
{@render children()}
