<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Field from "$lib/components/ui/field/index.js";

	let email = $state("");
	let sent = $state(false);
	let loading = $state(false);
	let error = $state("");

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = "";

		try {
			// TODO: call forgot password API
			sent = true;
		} catch {
			error = "Gagal mengirim email. Coba lagi nanti.";
		} finally {
			loading = false;
		}
	}
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Lupa kata sandi</Card.Title>
		<Card.Description>
			{#if sent}
				Cek email kamu untuk link reset password.
			{:else}
				Masukkan email kamu dan kami akan kirim link untuk reset password.
			{/if}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if sent}
			<Field.Group>
				<Field.Field>
					<Field.Description class="text-center">
						Tidak dapat email?
						<button
							type="button"
							class="underline"
							onclick={() => (sent = false)}
						>
							Kirim ulang
						</button>
					</Field.Description>
				</Field.Field>
				<Field.Field>
					<Field.Description class="text-center">
						<a href="/login" class="underline">Kembali ke halaman masuk</a>
					</Field.Description>
				</Field.Field>
			</Field.Group>
		{:else}
			<form onsubmit={handleSubmit}>
				<Field.Group>
					<Field.Field>
						<Field.Label for="forgot-email">Email</Field.Label>
						<Input
							id="forgot-email"
							type="email"
							bind:value={email}
							placeholder="nama@email.com"
							required
						/>
						{#if error}
							<Field.Description class="text-destructive">
								{error}
							</Field.Description>
						{/if}
					</Field.Field>
					<Field.Field>
						<Button type="submit" class="w-full" disabled={loading}>
							{#if loading}
								Mengirim...
							{:else}
								Kirim link reset
							{/if}
						</Button>
						<Field.Description class="text-center">
							<a href="/login" class="underline">Kembali ke halaman masuk</a>
						</Field.Description>
					</Field.Field>
				</Field.Group>
			</form>
		{/if}
	</Card.Content>
</Card.Root>
