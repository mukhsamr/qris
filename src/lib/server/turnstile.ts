import type { RequestEvent } from '@sveltejs/kit';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const LOCAL_TEST_SITE_KEY = '1x00000000000000000000AA';
const LOCAL_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

type TurnstileSecret = string | { get(): Promise<string> };

type TurnstileResponse = {
	success: boolean;
	'action'?: string;
	'error-codes'?: string[];
};

async function readSecret(secret: TurnstileSecret | undefined): Promise<string | null> {
	if (!secret) return null;
	if (typeof secret === 'string') return secret;
	return secret.get();
}

function isLocalhost(url: URL): boolean {
	return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
}

export function getTurnstileSiteKey(event: RequestEvent): string {
	if (isLocalhost(event.url)) return LOCAL_TEST_SITE_KEY;
	return event.platform?.env.TURNSTILE_SITE_KEY ?? '';
}

export async function verifyTurnstile(
	event: RequestEvent,
	token: unknown,
	expectedAction?: string
): Promise<{ success: true } | { success: false; error: string }> {
	if (typeof token !== 'string' || !token) {
		return { success: false, error: 'Verifikasi Turnstile wajib diisi' };
	}

	const secret = isLocalhost(event.url)
		? LOCAL_TEST_SECRET_KEY
		: await readSecret(event.platform?.env.TURNSTILE_SECRET_KEY);
	if (!secret) {
		return { success: false, error: 'Konfigurasi Turnstile belum tersedia' };
	}

	const formData = new FormData();
	formData.set('secret', secret);
	formData.set('response', token);

	const remoteIp = event.request.headers.get('CF-Connecting-IP');
	if (remoteIp) {
		formData.set('remoteip', remoteIp);
	}

	const response = await fetch(SITEVERIFY_URL, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		return { success: false, error: 'Gagal memvalidasi Turnstile' };
	}

	const result = await response.json() as TurnstileResponse;
	if (!result.success) {
		return { success: false, error: 'Verifikasi Turnstile gagal' };
	}

	if (expectedAction && result.action && result.action !== expectedAction) {
		return { success: false, error: 'Verifikasi Turnstile tidak valid' };
	}

	return { success: true };
}
