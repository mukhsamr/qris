<script lang="ts">
	import DashboardSidebar from "$lib/components/ui/DashboardSidebar.svelte";
	import { page } from "$app/state";

	let { data, children } = $props();

	const pageTitle: Record<string, string> = {
		"/dashboard": "Dashboard",
		"/dashboard/qris": "QRIS",
		"/dashboard/api-keys": "API Keys",
		"/dashboard/settings": "Settings",
	};

	let title = $derived(pageTitle[page.url.pathname] ?? "Dashboard");
</script>

<div class="flex min-h-dvh bg-background">
	<DashboardSidebar
		userName={data.user?.name ?? "User"}
		userEmail={data.user?.email ?? ""}
		userAvatarUrl={data.user?.avatarUrl ?? ""}
	/>

	<div class="flex flex-1 flex-col lg:ml-60">
		<!-- Top bar -->
		<header class="sticky top-0 z-30 flex h-13 shrink-0 items-center border-b border-border bg-background px-6">
			<h1 class="text-sm font-semibold tracking-[-0.02em]">{title}</h1>
		</header>

		<!-- Content -->
		<main class="flex-1 p-6">
			{@render children?.()}
		</main>
	</div>
</div>
