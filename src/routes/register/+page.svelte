<script lang="ts">
	import SignupForm from "$lib/components/signup-form.svelte";

	let { data }: { data: { turnstileSiteKey: string } } = $props();
</script>

<svelte:head>
	<title>Daftar — QRIS Converter</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
	<SignupForm turnstileSiteKey={data.turnstileSiteKey} />
</div>
