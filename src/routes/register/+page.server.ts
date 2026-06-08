import type { PageServerLoad } from './$types';
import { getTurnstileSiteKey } from '$lib/server/turnstile';

function getAuthErrorMessage(error: string | null): string {
	switch (error) {
		case 'config':
			return 'Konfigurasi Google login lokal belum lengkap. Periksa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, dan DB lokal.';
		case 'google_auth_failed':
			return 'Login Google gagal. Pastikan callback Google memakai http://localhost:5173/login/google/callback dan buka app dari http://localhost:5173.';
		default:
			return '';
	}
}

export const load: PageServerLoad = async (event) => ({
	turnstileSiteKey: getTurnstileSiteKey(event),
	authError: getAuthErrorMessage(event.url.searchParams.get('error')),
});
