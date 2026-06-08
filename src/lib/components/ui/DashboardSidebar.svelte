<script lang="ts" module>
	export const navItems = [
		{ label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
		{ label: "QRIS", href: "/dashboard/qris", icon: "qr-code" },
		{ label: "API Keys", href: "/dashboard/api-keys", icon: "key" },
		{ label: "Settings", href: "/dashboard/settings", icon: "settings" },
	] as const;
</script>

<script lang="ts">
	import logo from "$lib/assets/logo.jpg";
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import LogOut from "@lucide/svelte/icons/log-out";
	import User from "@lucide/svelte/icons/user";
	import LayoutDashboard from "@lucide/svelte/icons/layout-dashboard";
	import QrCode from "@lucide/svelte/icons/qr-code";
	import KeyRound from "@lucide/svelte/icons/key-round";
	import Settings from "@lucide/svelte/icons/settings";

	let { userName = "User", userEmail = "user@email.com", userAvatarUrl = "" } = $props();

	const iconMap = {
		"layout-dashboard": LayoutDashboard,
		"qr-code": QrCode,
		key: KeyRound,
		settings: Settings,
	};

	let currentPath = $derived(page.url.pathname);
	let formEl = $state<HTMLFormElement | null>(null);

	function submitLogout() {
		formEl?.submit();
	}
</script>

<form action="/api/auth/logout" method="POST" bind:this={formEl} class="hidden"></form>

<!-- Mobile trigger -->
<div class="fixed top-3 left-3 z-50 lg:hidden">
	<Button
		variant="outline"
		size="icon-sm"
		class="bg-background"
		onclick={() => document.body.classList.toggle('sidebar-open')}
	>
		<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<line x1="3" y1="6" x2="21" y2="6"/>
			<line x1="3" y1="12" x2="21" y2="12"/>
			<line x1="3" y1="18" x2="21" y2="18"/>
		</svg>
	</Button>
</div>

<!-- Sidebar -->
<aside
	class="fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:translate-x-0 -translate-x-full data-[open=true]:translate-x-0"
	data-open={false}
>
	<div class="flex h-full flex-col">
		<!-- Logo -->
		<div class="flex h-13 items-center gap-2.5 border-b border-sidebar-border px-5 shrink-0">
			<img src={logo} alt="Logo" class="size-7 object-contain" />
			<span class="text-sm font-semibold tracking-[-0.02em]">
				QRIS Panel
			</span>
		</div>

		<!-- Nav -->
		<nav class="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
			{#each navItems as item}
				{@const IconComp = iconMap[item.icon]}
				<a
					href={item.href}
					class="flex items-center gap-2.5 h-8 px-3 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold {currentPath === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold' : 'text-sidebar-foreground/80'}"
					data-active={currentPath === item.href}
				>
					<IconComp class="size-4 shrink-0" />
					{item.label}
				</a>
			{/each}
		</nav>

		<!-- User section -->
		<div class="border-t border-sidebar-border p-3 shrink-0">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
					<button
						{...props}
						class="flex w-full items-center gap-2.5 h-9 px-3 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						type="button"
					>
						{#if userAvatarUrl}
							<img src={userAvatarUrl} alt={userName} class="size-7 shrink-0 rounded-full object-cover" />
						{:else}
							<div
								class="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold"
							>
								{userName.charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{userName}</p>
							<p class="truncate text-xs text-muted-foreground">
								{userEmail}
							</p>
						</div>
					</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" side="top" class="w-52">
					<DropdownMenu.Item onmousedown={() => window.location.href = '/dashboard/settings'}>
						<User class="size-4" data-icon="inline-start" />
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Separator />
					<DropdownMenu.Item onmousedown={submitLogout}>
						<LogOut class="size-4" data-icon="inline-start" />
						Keluar
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</aside>
