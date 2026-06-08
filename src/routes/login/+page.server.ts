import type { PageServerLoad } from './$types';
import { getTurnstileSiteKey } from '$lib/server/turnstile';

export const load: PageServerLoad = async (event) => ({
	turnstileSiteKey: getTurnstileSiteKey(event),
});
