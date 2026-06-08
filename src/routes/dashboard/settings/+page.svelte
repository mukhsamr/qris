<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Alert from "$lib/components/ui/alert";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { User, Mail, Lock, Unlink, CheckCircle2, CircleAlert } from "@lucide/svelte/icons";
	import { enhance } from "$app/forms";
	import { page } from "$app/state";

	type LinkedAccount = {
		id: string;
		provider: string;
		createdAt: string;
	};

	type SettingsForm = {
		success?: boolean;
		error?: string;
		field?: 'profile' | 'password';
	};

	let { data, form }: {
		data: {
			user: {
				name: string | null;
				email: string;
				hasPassword: boolean;
			};
			linkedAccounts: LinkedAccount[];
		};
		form?: SettingsForm;
	} = $props();

	let googleAccount = $derived(data.linkedAccounts.find((account) => account.provider === 'google'));

	let disconnecting = $state<string | null>(null);
	let disconnectError = $state("");
	let showDeleteAccountConfirm = $state(false);
	let activeTab = $state("profile");

	let profileSuccess = $state(false);
	let passwordSuccess = $state(false);
	let googleConnected = $derived(page.url.searchParams.get("connected") === "google");
	let googleError = $derived(page.url.searchParams.get("error"));
	let googleErrorMessage = $derived(
		googleError === "google_already_linked"
			? "Akun Google ini sudah terhubung ke akun QRIS lain."
			: googleError
				? "Gagal menghubungkan akun Google."
				: ""
	);

	// Watch for form action responses
	$effect(() => {
		if (form?.success) {
			if (form.field === 'profile') profileSuccess = true;
			if (form.field === 'password') passwordSuccess = true;
		}
		if (form?.field === 'profile') activeTab = "profile";
		if (form?.field === 'password') activeTab = "password";
	});

	$effect(() => {
		if (googleConnected || googleError) {
			activeTab = "accounts";
		}
	});

	async function handleDisconnect(accountId: string) {
		disconnecting = accountId;
		disconnectError = "";
		try {
			const res = await fetch("/api/settings/google/disconnect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ accountId }),
			});
			if (res.ok) {
				window.location.reload();
			} else {
				const result = await res.json().catch(() => null) as { error?: string } | null;
				disconnectError = result?.error ?? "Gagal memutuskan akun Google.";
			}
		} finally {
			disconnecting = null;
		}
	}
</script>

<svelte:head>
	<title>Settings — QRIS Panel</title>
</svelte:head>

<div class="max-w-5xl">
	<div class="mb-6">
		<h2 class="text-lg font-semibold tracking-[-0.02em]">Settings</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Kelola profil, keamanan, dan akun terhubung kamu.
		</p>
	</div>

	{#if googleAccount && !data.user.hasPassword}
		<Alert.Root variant="warning" class="mb-6 max-w-2xl">
			<CircleAlert class="size-4" />
			<Alert.Title>Setup kata sandi belum selesai</Alert.Title>
			<Alert.Description>
				Akun ini masuk dengan Google dan belum punya kata sandi. Buat kata sandi dulu sebelum memutuskan Google agar kamu tetap bisa login.
			</Alert.Description>
		</Alert.Root>
	{/if}

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="profile">Profil</Tabs.Trigger>
			<Tabs.Trigger value="accounts">Akun Terhubung</Tabs.Trigger>
			<Tabs.Trigger value="password">Kata Sandi</Tabs.Trigger>
			<Tabs.Trigger value="danger">Zona Berbahaya</Tabs.Trigger>
		</Tabs.List>

		<!-- Profile tab -->
		<Tabs.Content value="profile" class="pt-6">
			<Card.Root class="max-w-lg">
				<Card.Content>
					{#if profileSuccess}
						<Alert.Root variant="success" class="mb-4">
							<CheckCircle2 class="size-4" />
							<Alert.Title>Profil berhasil diperbarui.</Alert.Title>
						</Alert.Root>
					{/if}
					<form method="POST" action="?/updateProfile" use:enhance onsubmit={() => profileSuccess = false}>
						<div class="space-y-4">
							<Field.Field>
								<Field.Label for="settings-name">Nama</Field.Label>
								<div class="relative">
									<User class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input id="settings-name" name="name" value={data.user.name ?? ""} class="pl-9" />
								</div>
							</Field.Field>
							<Field.Field>
								<Field.Label for="settings-email">Email</Field.Label>
								<div class="relative">
									<Mail class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input id="settings-email" type="email" value={data.user.email} class="pl-9" disabled />
								</div>
								<Field.Description>
									Email tidak dapat diubah.
								</Field.Description>
							</Field.Field>
							{#if form?.error && form?.field === 'profile'}
								<Alert.Root variant="destructive">
									<CircleAlert class="size-4" />
									<Alert.Title>{form.error}</Alert.Title>
								</Alert.Root>
							{/if}
							<Button type="submit">Simpan perubahan</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Connected Accounts tab -->
		<Tabs.Content value="accounts" class="pt-6">
			<Card.Root class="max-w-lg">
				<Card.Header>
					<Card.Title class="text-base">Akun Terhubung</Card.Title>
					<Card.Description>
						Kelola akun pihak ketiga yang terhubung ke akun QRIS kamu.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#if googleConnected}
						<Alert.Root variant="success">
							<CheckCircle2 class="size-4" />
							<Alert.Title>Akun Google berhasil dihubungkan.</Alert.Title>
						</Alert.Root>
					{/if}
					{#if googleErrorMessage}
						<Alert.Root variant="destructive">
							<CircleAlert class="size-4" />
							<Alert.Title>{googleErrorMessage}</Alert.Title>
						</Alert.Root>
					{/if}
					{#if disconnectError}
						<Alert.Root variant="destructive">
							<CircleAlert class="size-4" />
							<Alert.Title>{disconnectError}</Alert.Title>
						</Alert.Root>
					{/if}
					<!-- Google Account -->
					<div class="flex items-center justify-between rounded-lg border border-border p-4">
						<div class="flex items-center gap-3">
							<svg class="size-5" viewBox="0 0 24 24">
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
							</svg>
							<div>
								<p class="text-sm font-medium">Google</p>
								{#if googleAccount}
									<p class="flex items-center gap-1 text-xs text-muted-foreground">
										<CheckCircle2 class="size-3 text-emerald-500" />
										Terhubung pada {new Date(googleAccount.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
									</p>
								{:else}
									<p class="text-xs text-muted-foreground">Belum terhubung</p>
								{/if}
							</div>
						</div>
						{#if googleAccount}
							<Button
								variant="outline"
								size="sm"
								disabled={disconnecting !== null}
								onclick={() => handleDisconnect(googleAccount.id)}
							>
								{#if disconnecting === googleAccount.id}
									<span class="flex items-center gap-1.5">
										<span class="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
										Memutuskan...
									</span>
								{:else}
									<Unlink class="size-3.5" />
									Putuskan
								{/if}
							</Button>
						{:else}
							<Button variant="outline" size="sm" href="/login/google">
								Hubungkan
							</Button>
						{/if}
					</div>

					{#if data.linkedAccounts.length === 0}
						<p class="text-center text-sm text-muted-foreground py-4">
							Belum ada akun pihak ketiga yang terhubung.
						</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Password tab -->
		<Tabs.Content value="password" class="pt-6">
			<Card.Root class="max-w-lg">
				<Card.Content>
					{#if passwordSuccess}
						<Alert.Root variant="success" class="mb-4">
							<CheckCircle2 class="size-4" />
							<Alert.Title>{data.user.hasPassword ? 'Password berhasil diubah.' : 'Password berhasil dibuat.'}</Alert.Title>
						</Alert.Root>
					{/if}
					{#if googleAccount && !data.user.hasPassword}
						<Alert.Root variant="warning" class="mb-4">
							<CircleAlert class="size-4" />
							<Alert.Title>Buat kata sandi untuk akun ini</Alert.Title>
							<Alert.Description>
								Setelah kata sandi dibuat, kamu bisa login dengan email dan kata sandi walaupun Google diputuskan.
							</Alert.Description>
						</Alert.Root>
					{/if}
					<form method="POST" action="?/changePassword" use:enhance onsubmit={() => passwordSuccess = false}>
						<div class="space-y-4">
							{#if data.user.hasPassword}
								<Field.Field>
									<Field.Label for="current-password">Kata sandi saat ini</Field.Label>
									<div class="relative">
										<Lock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
										<Input id="current-password" name="currentPassword" type="password" class="pl-9" />
									</div>
								</Field.Field>
							{/if}
							<Field.Field>
								<Field.Label for="new-password">Kata sandi baru</Field.Label>
								<div class="relative">
									<Lock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input id="new-password" name="newPassword" type="password" class="pl-9" />
								</div>
							</Field.Field>
							<Field.Field>
								<Field.Label for="confirm-password">Konfirmasi kata sandi baru</Field.Label>
								<div class="relative">
									<Lock class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
									<Input id="confirm-password" name="confirmPassword" type="password" class="pl-9" />
								</div>
							</Field.Field>
							{#if form?.error && form?.field === 'password'}
								<Alert.Root variant="destructive">
									<CircleAlert class="size-4" />
									<Alert.Title>{form.error}</Alert.Title>
								</Alert.Root>
							{/if}
							<Button type="submit">{data.user.hasPassword ? 'Ubah kata sandi' : 'Buat kata sandi'}</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<!-- Danger zone -->
		<Tabs.Content value="danger" class="pt-6">
			<Alert.Root variant="destructive" class="max-w-lg p-5 pr-5">
				<CircleAlert class="size-5" />
				<Alert.Title>Hapus akun</Alert.Title>
				<Alert.Description>
					Tindakan ini tidak bisa dibatalkan. Semua data QRIS, API key, dan riwayat generate kamu akan dihapus secara permanen.
				</Alert.Description>
				<Alert.Action class="static col-start-2 row-start-3 mt-3 justify-self-start">
					<Button variant="destructive" type="button" onclick={() => showDeleteAccountConfirm = true}>
						Hapus akun
					</Button>
				</Alert.Action>
			</Alert.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>

<Dialog.Root bind:open={showDeleteAccountConfirm}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Hapus akun?</Dialog.Title>
			<Dialog.Description>
				Semua data QRIS, API key, dan riwayat generate akan dihapus permanen.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" type="button" onclick={() => showDeleteAccountConfirm = false}>
				Batal
			</Button>
			<form method="POST" action="?/deleteAccount" use:enhance>
				<Button variant="destructive" type="submit">
					Hapus akun
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
