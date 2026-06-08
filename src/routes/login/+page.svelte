<script lang="ts">
	import LoginForm from "$lib/components/login-form.svelte";

	let { data }: { data: { turnstileSiteKey: string; authError: string } } = $props();
</script>

<svelte:head>
	<title>Masuk — QRIS Converter</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
	<LoginForm turnstileSiteKey={data.turnstileSiteKey} authError={data.authError} />
</div>
