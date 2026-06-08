<script lang="ts">
	import { onMount } from 'svelte';

	let {
		siteKey,
		action,
		token = $bindable(''),
		disabled = false,
	}: {
		siteKey: string;
		action: string;
		token?: string;
		disabled?: boolean;
	} = $props();

	let container = $state<HTMLDivElement | null>(null);
	let widgetId: string | null = null;

	const scriptSrc = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

	type TurnstileApi = {
		render: (
			container: HTMLElement,
			options: {
				sitekey: string;
				action: string;
				callback: (value: string) => void;
				'expired-callback': () => void;
				'error-callback': () => void;
			}
		) => string;
		reset: (widgetId: string) => void;
	};

	function getTurnstile() {
		return (window as Window & { turnstile?: TurnstileApi }).turnstile;
	}

	function loadTurnstileScript() {
		if (getTurnstile()) return Promise.resolve();

		const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);
		if (existing) {
			return new Promise<void>((resolve, reject) => {
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true });
			});
		}

		return new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = scriptSrc;
			script.async = true;
			script.defer = true;
			script.addEventListener('load', () => resolve(), { once: true });
			script.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true });
			document.head.appendChild(script);
		});
	}

	export function reset() {
		token = '';
		const turnstile = getTurnstile();
		if (widgetId && turnstile) {
			turnstile.reset(widgetId);
		}
	}

	onMount(async () => {
		if (!container || !siteKey) return;

		await loadTurnstileScript();
		const turnstile = getTurnstile();
		if (!turnstile || !container) return;

		widgetId = turnstile.render(container, {
			sitekey: siteKey,
			action,
			callback: (value) => {
				token = value;
			},
			'expired-callback': () => {
				token = '';
			},
			'error-callback': () => {
				token = '';
			},
		});
	});
</script>

<div class:pointer-events-none={disabled} class:opacity-60={disabled}>
	<div bind:this={container}></div>
</div>
