<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import Turnstile from "$lib/components/Turnstile.svelte";

	let {
		turnstileSiteKey,
	}: {
		turnstileSiteKey: string;
	} = $props();
	const id = $props.id();

	let email = $state("");
	let password = $state("");
	let turnstileToken = $state("");
	let error = $state("");
	let loading = $state(false);

	type LoginResponse = {
		success?: boolean;
		error?: string;
	};

	function handleGoogleLogin() {
		window.location.href = "/login/google";
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = "";
		if (!turnstileToken) {
			error = "Selesaikan verifikasi Turnstile terlebih dahulu";
			return;
		}
		loading = true;
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, turnstileToken }),
			});
			const result = await res.json() as LoginResponse;
			if (result.success) {
				window.location.href = '/dashboard';
			} else {
				error = result.error || 'Gagal masuk';
			}
		} catch {
			error = 'Gagal terhubung ke server';
		} finally {
			loading = false;
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Masuk</Card.Title>
		<Card.Description>
			Masukkan email kamu untuk masuk ke akun
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<form onsubmit={handleSubmit}>
			<Field.Group>
				<Field.Field>
					<Field.Label for="email-{id}">Email</Field.Label>
					<Input
						id="email-{id}"
						type="email"
						bind:value={email}
						placeholder="nama@email.com"
						required
					/>
				</Field.Field>
				<Field.Field>
					<div class="flex items-center">
						<Field.Label for="password-{id}">Kata sandi</Field.Label>
						<a
							href="/forgot-password"
							class="ms-auto inline-block text-sm hover:underline"
						>
							Lupa sandi?
						</a>
					</div>
					<Input
						id="password-{id}"
						type="password"
						bind:value={password}
						placeholder="••••••••"
						required
					/>
				</Field.Field>
				<Field.Field>
					<Turnstile siteKey={turnstileSiteKey} action="login" bind:token={turnstileToken} disabled={loading} />
				</Field.Field>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
				<Field.Field>
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Memproses...' : 'Masuk'}
					</Button>
					<Button
						variant="outline"
						type="button"
						class="w-full"
						onclick={handleGoogleLogin}
					>
						<svg class="size-4" viewBox="0 0 24 24">
							<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
							<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
							<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
							<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
						</svg>
						Lanjutkan dengan Google
					</Button>
					<Field.Description class="text-center">
						Belum punya akun?
						<a href="/register" class="underline">Daftar</a>
					</Field.Description>
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
